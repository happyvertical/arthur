import { randomUUID } from 'node:crypto';
import { getTestDatabase } from '@happyvertical/smrt-core';
import {
  CUSTOMIZE_OVERVIEW_PERMISSION,
  CUSTOMIZE_SHELL_PERMISSION,
  PERSONALIZE_OVERVIEW_PERMISSION,
  PERSONALIZE_SHELL_PERMISSION,
} from '@happyvertical/smrt-preferences';
import { resetTenancy, setupTestTenancy, withTenant } from '@happyvertical/smrt-tenancy';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { homePath, loadCookbook, saveCookbookEdits } from '../src/lib/server/cookbook';
import { load as loadHome } from '../src/routes/+page.server';
import { load as loadEntry } from '../src/routes/m/[pkg]/[model]/[[key]]/+page.server';

let testDb: Awaited<ReturnType<typeof getTestDatabase>>;

// The runtime only supplies the database; the preference tables live in it.
vi.mock('../src/lib/server/smrt', () => ({
  runtime: { databaseConfig: () => testDb },
}));

const root = process.cwd();
const source = { root, file: 'tests/fixtures/accounts.cookbook.json' };

describe('cookbook home route', () => {
  it('sends an anonymous visitor to the existing owner setup', async () => {
    await expect(
      loadHome({ locals: { user: null } } as Parameters<typeof loadHome>[0]),
    ).rejects.toMatchObject({ status: 303, location: '/setup' });
  });

  it('sends the owner to the first cookbook section', async () => {
    const app = await loadCookbook({ signedIn: false, ...source });
    await expect(
      loadHome({
        locals: { user: { id: 'owner' } },
        parent: async () => ({ cookbookApp: app }),
      } as unknown as Parameters<typeof loadHome>[0]),
    ).rejects.toMatchObject({
      status: 303,
      location: homePath(app as NonNullable<typeof app>),
    });
  });

  it('refuses a missing cookbook rather than providing a parallel Notes app', async () => {
    await expect(
      loadHome({
        locals: { user: { id: 'owner' } },
        parent: async () => ({ cookbookApp: null }),
      } as unknown as Parameters<typeof loadHome>[0]),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe('cookbook intake: the shell comes from smrt.cookbook.json', () => {
  it('shares the generated initial app for the default anonymous read', async () => {
    const { initialApp } = await import('virtual:smrt-cookbook-app');
    expect(await loadCookbook({ signedIn: false })).toBe(initialApp);
    expect(Object.isFrozen(initialApp.catalog.models)).toBe(true);
  });

  it('loads the cookbook and the catalog of the recipes it names', async () => {
    const app = await loadCookbook({ signedIn: false, ...source });
    expect(app?.cookbook.name).toBe('Accounts');
    expect(app?.catalog.recipes.map((r) => r.id).sort()).toEqual([
      'chat.rooms',
      'users.roles-and-permissions',
    ]);
  });

  it('is null for a project without a cookbook', async () => {
    expect(await loadCookbook({ signedIn: false, root, file: 'missing.json' })).toBeNull();
  });

  it('refuses a recipe no installed package declares', async () => {
    await expect(
      loadCookbook({
        signedIn: false,
        root,
        file: 'tests/fixtures/unknown-recipe.cookbook.json',
      }),
    ).rejects.toThrow(/cookbook/i);
  });

  it('opens on the first section', async () => {
    const app = await loadCookbook({ signedIn: false, ...source });
    expect(homePath(app as NonNullable<typeof app>)).toMatch(/^\/s\//);
  });

  it('serves an entry page for a model in the nav, and 404s for others', async () => {
    const app = await loadCookbook({ signedIn: false, ...source });
    const event = (params: Record<string, string>) =>
      ({
        params,
        parent: async () => ({ cookbookApp: app }),
        locals: { user: { id: 'u1' }, permissions: ['roles.read'] },
      }) as unknown as Parameters<typeof loadEntry>[0];

    const data = await loadEntry(event({ pkg: 'users', model: 'Role' }));
    expect(data).toMatchObject({
      entry: { model: '@happyvertical/smrt-users:Role', className: 'Role' },
    });
    await expect(loadEntry(event({ pkg: 'users', model: 'Nope' }))).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe('cookbook intake: edits persist through smrt-preferences', () => {
  const all = new Set([
    CUSTOMIZE_OVERVIEW_PERMISSION,
    PERSONALIZE_OVERVIEW_PERMISSION,
    CUSTOMIZE_SHELL_PERMISSION,
    PERSONALIZE_SHELL_PERMISSION,
  ]);
  let tenantId: string;
  let alice: string;
  let bob: string;

  const as = <T>(userId: string, fn: () => Promise<T>) =>
    withTenant({ tenantId, userId, permissions: all }, fn);

  beforeEach(async () => {
    setupTestTenancy();
    testDb = await getTestDatabase({ type: 'sqlite', url: ':memory:' });
    tenantId = randomUUID();
    alice = randomUUID();
    bob = randomUUID();
  });
  afterEach(async () => {
    resetTenancy();
    await testDb?.close?.();
  });

  const note = {
    version: 1,
    added: [{ id: 'w1', type: 'note', span: 2, options: { body: 'Hello' } }],
  };

  it('stores an overview edit for the person, and lays it over the file', async () => {
    const app = await as(alice, () => loadCookbook({ signedIn: true, ...source }));
    const section = Object.keys(
      (await import('@happyvertical/smrt-svelte/cookbook/server')).buildCookbookShell({
        cookbook: app?.cookbook as never,
        catalog: app?.catalog as never,
      }).overviews,
    )[0];
    expect(app?.cookbook.overviews).toBeUndefined();

    const saved = await as(alice, () =>
      saveCookbookEdits({ ...app?.cookbook, overviews: { [section]: note } }, 'user', source),
    );
    expect(saved).toEqual({ ok: true, saved: [section] });

    const again = await as(alice, () => loadCookbook({ signedIn: true, ...source }));
    expect(again?.cookbook.overviews?.[section]).toMatchObject({
      added: [{ type: 'note', options: { body: 'Hello' } }],
    });

    // Personal: another person in the same tenant still sees the file's cookbook.
    const other = await as(bob, () => loadCookbook({ signedIn: true, ...source }));
    expect(other?.cookbook.overviews).toBeUndefined();

    // Resetting (saving the file's own state) removes the stored preference.
    const reset = await as(alice, () => saveCookbookEdits(app?.cookbook, 'user', source));
    expect(reset).toEqual({ ok: true, saved: [section] });
    const cleared = await as(alice, () => loadCookbook({ signedIn: true, ...source }));
    expect(cleared?.cookbook.overviews).toBeUndefined();
  });

  it('stores a shell layout edit', async () => {
    const app = await as(alice, () => loadCookbook({ signedIn: true, ...source }));
    const layout = {
      version: 1,
      sectionOrder: ['section:users', 'section:chat'],
    };
    const saved = await as(alice, () =>
      saveCookbookEdits({ ...app?.cookbook, layout }, 'user', source),
    );
    expect(saved).toEqual({ ok: true, saved: ['layout'] });
    const again = await as(alice, () => loadCookbook({ signedIn: true, ...source }));
    expect(again?.cookbook.layout).toMatchObject({
      sectionOrder: ['section:users', 'section:chat'],
    });
  });

  it('refuses an edit the person may not make, and invalid widgets', async () => {
    const app = await loadCookbook({ signedIn: true, ...source }).catch(() => null);
    expect(app).not.toBeNull();
    const denied = await withTenant(
      { tenantId, userId: alice, permissions: new Set<string>() },
      () =>
        saveCookbookEdits(
          { ...app?.cookbook, layout: { version: 1, sectionOrder: ['x'] } },
          'user',
          source,
        ),
    );
    expect(denied).toMatchObject({ ok: false, reason: 'not_allowed' });
  });
});
