import { describe, expect, it } from 'vitest';
import { load } from '../src/routes/onboarding/+page.server';

const event = (onboarding: unknown, path = '/onboarding', signedIn = true) =>
  ({
    locals: { user: signedIn ? { id: 'local-owner' } : null },
    url: new URL(path, 'http://127.0.0.1:4998'),
    parent: async () => ({ onboarding }),
  }) as unknown as Parameters<typeof load>[0];
describe('onboarding route composition', () => {
  it('uses the existing owner session and resumes the framework state', async () => {
    await expect(load(event(null, '/onboarding', false))).rejects.toMatchObject({
      status: 303,
      location: '/setup',
    });
    const progress = { completed: false, step: 'ai' };
    await expect(load(event(progress))).resolves.toEqual({
      onboarding: progress,
    });
  });
  it('does not show completed onboarding again, and Settings explicitly opts into replacement', async () => {
    const progress = { completed: true, rerunning: false, step: 'done' };
    await expect(load(event(progress))).rejects.toMatchObject({
      status: 303,
      location: '/',
    });
    await expect(load(event(progress, '/onboarding?restart=1'))).resolves.toEqual({
      onboarding: progress,
    });
    await expect(
      load(event({ ...progress, rerunning: true, step: 'template' })),
    ).resolves.toMatchObject({ onboarding: { step: 'template' } });
  });
});
