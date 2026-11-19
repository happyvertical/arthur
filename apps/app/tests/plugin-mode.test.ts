import { ADMIN_SHELL_CONTEXT, createShellState } from '@happyvertical/smrt-svelte/workspace';
import { render } from 'svelte/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PluginModeSettings from '../src/lib/PluginModeSettings.svelte';
import { load } from '../src/routes/settings/+page.server';
import SettingsPage from '../src/routes/settings/+page.svelte';
import InferencePage from '../src/routes/settings/inference/+page.svelte';

const { host } = vi.hoisted(() => ({
  host: {
    prebuilt: vi.fn(),
    assistant: { GET: vi.fn() },
    pluginMode: vi.fn(),
    history: vi.fn(),
  },
}));
vi.mock('../src/lib/server/smrt', () => ({ host }));
beforeEach(() => {
  host.history.mockResolvedValue(Response.json({ revision: 1, entries: [] }));
  host.prebuilt.mockResolvedValue(Response.json({ enabled: true, revision: null }));
  host.assistant.GET.mockResolvedValue(Response.json({ approvals: [] }));
  host.pluginMode.mockResolvedValue(new Response(null, { status: 403 }));
});

vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn(), goto: vi.fn() }));
vi.mock('$app/state', () => ({
  page: { url: new URL('http://127.0.0.1/settings/inference') },
}));
describe('plugin settings SSR', () => {
  it('renders the owner connection controls without interpreting settings as a Svelte store', () => {
    const rendered = render(PluginModeSettings, {
      props: {
        settings: {
          embed: false,
          connections: [
            {
              client: 'codex',
              name: 'Codex',
              status: 'not_connected',
              lastSeen: null,
              setup: null,
            },
          ],
          chatgpt: 'ChatGPT remote connectors cannot reach this local app.',
        },
      },
    });
    expect(rendered.body).toContain('Use with your own AI');
    expect(rendered.body).toContain('Generate setup');
    expect(rendered.body).toContain('Hide the in-app assistant');
    expect(rendered.body).toContain('Codex');
  });
});

describe('plugin settings composition', () => {
  it('keeps existing settings and approvals available when plugin ownership is refused', async () => {
    const data = await load({
      locals: { user: { id: 'owner' } },
      params: {},
    } as never);
    expect(data).toMatchObject({
      history: { revision: 1, entries: [] },
      pluginMode: null,
      approvals: [],
      prebuilt: { enabled: true },
    });
  });
  it('surfaces a plugin backend failure instead of treating it as an ownership refusal', async () => {
    host.pluginMode.mockResolvedValue(new Response(null, { status: 503 }));
    await expect(load({ locals: { user: { id: 'owner' } }, params: {} } as never)).rejects.toThrow(
      'Plugin settings unavailable',
    );
  });
});

it('preserves real structure history alongside plugin and approval settings', async () => {
  const entry = {
    id: '2',
    action: 'Added Visit note to Members.',
    resourceType: 'App structure',
    resourceId: 'Revision 2',
  };
  host.history.mockResolvedValue(Response.json({ revision: 2, entries: [entry] }));
  const data = await load({
    locals: { user: { id: 'owner' } },
    params: {},
  } as never);
  expect(data).toMatchObject({
    history: { revision: 2, entries: [entry] },
    approvals: [],
    pluginMode: null,
  });
});

it('renders approvals first without duplicating them in prebuilt controls and keeps history and own-AI sections', () => {
  const data = {
    history: {
      revision: 2,
      entries: [
        {
          id: '2',
          action: 'Added Visit note to Members.',
          resourceType: 'App structure',
          resourceId: 'Revision 2',
        },
      ],
    },
    prebuilt: { enabled: true, revision: null },
    approvals: [
      ...(['pending', 'approved', 'executing'] as const).map((status) => ({
        id: status,
        callId: `call-${status}`,
        tool: 'app.addField',
        summary: `Unsettled ${status} change.`,
        status,
      })),
      ...(['succeeded', 'denied', 'failed', 'expired'] as const).map((status) => ({
        id: status,
        callId: `call-${status}`,
        tool: 'app.addField',
        summary: `Terminal ${status} change.`,
        status,
      })),
    ],
    pluginMode: {
      embed: false,
      connections: [],
      chatgpt: 'Local connections only.',
    },
  };
  const rendered = render(SettingsPage, {
    context: new Map([[ADMIN_SHELL_CONTEXT, createShellState()]]),
    props: { params: {}, form: null, data: data as never },
  });
  expect(rendered.body).toContain('data-smrt-component="OwnerApprovalsSettings"');
  const approvalsPosition = rendered.body.indexOf('data-smrt-component="OwnerApprovalsSettings"');
  expect(approvalsPosition).toBeLessThan(rendered.body.indexOf('id="change-history-title"'));
  expect(approvalsPosition).toBeLessThan(rendered.body.indexOf('Use with your own AI'));
  expect(approvalsPosition).toBeLessThan(
    rendered.body.indexOf('data-smrt-component="PrebuiltComponentsSettings"'),
  );
  for (const status of ['pending', 'approved', 'executing'])
    expect(rendered.body.match(new RegExp(`Unsettled ${status} change\\.`, 'g'))).toHaveLength(1);
  expect(rendered.body).not.toContain('Terminal ');
  expect(rendered.body).not.toContain('No changes are waiting for approval.');
  expect(rendered.body).toContain('Change history');
  expect(rendered.body).toContain('Added Visit note to Members.');
  expect(rendered.body).toContain('Use with your own AI');
  expect(rendered.body).not.toContain('<time');
  const empty = render(SettingsPage, {
    context: new Map([[ADMIN_SHELL_CONTEXT, createShellState()]]),
    props: {
      params: {},
      form: null,
      data: { ...data, approvals: [] } as never,
    },
  });
  expect(empty.body).toContain('No changes are waiting for approval.');
});
