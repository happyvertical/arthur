import { defineConfig } from '@happyvertical/smrt-config';

import { readInstalledManifests } from '@happyvertical/smrt-svelte/cookbook/server';

const manifests = await readInstalledManifests(process.cwd());

// No `runtime` block: the local profile (single owner, SQLite in the OS data
// directory, loopback only) is the default.
export default defineConfig({
  // s-m-r-t packages whose models this app uses. Their tables are migrated
  // with the app's own (`pnpm db:migrate`). The list is every s-m-r-t
  // dependency in package.json that publishes a readable manifest,
  // so `smrt cookbook apply` extends it by adding dependencies.
  consumer: {
    packages: manifests
      .map((manifest) => manifest.packageName)
      .filter((name) => name !== '@happyvertical/smrt-core'),
  },

  // Inference resolves the signed-in owner's saved binding/key or SMRT_AI_*.
});
