import { cookbookHostVite } from '@happyvertical/smrt-template-sveltekit/host/generate';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type UserConfig } from 'vite';
export default defineConfig(
  async (): Promise<UserConfig> => ({
    plugins: [
      ...(await sveltekit()),
      ...(await cookbookHostVite({
        objectsDir: 'src/lib/models',
        collectionAliases: {
          '@happyvertical/smrt-messages:Account': 'messages-accounts',
          '@happyvertical/smrt-support:ServiceTimeEntry': 'support-servicetimeentries',
          '@happyvertical/smrt-sales:Agreement': 'sales-agreements',
        },
      })),
    ],
  }),
);
