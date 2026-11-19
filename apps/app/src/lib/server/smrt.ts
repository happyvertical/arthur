import { app } from 'virtual:smrt-cookbook-app';
import { createCookbookApplication } from '@happyvertical/smrt-template-sveltekit/host/server';
import { activationLoaders, activationManifest } from './smrt-register';

/** Local owner host: only the enabled SQLite closure is activated at boot. */
export const host = createCookbookApplication({
  title: 'Arthur',
  app,
  onboarding: true,
  packageName: '@arthur/app',
  application: 'arthur',
  lazyActivation: {
    manifest: activationManifest,
    loaders: activationLoaders,
    scope: 'arthur:local',
  },
});
export const runtime = host.runtime;
