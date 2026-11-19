import { smrtVitestPlugin } from '@happyvertical/smrt-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';
import appConfig from './vite.config';

export default defineConfig(async (env) =>
  mergeConfig(await appConfig(env), {
    plugins: [
      smrtVitestPlugin({
        include: ['src/lib/models/**/*.ts'],
        exclude: ['**/*.d.ts', '**/node_modules/**', '**/dist/**'],
      }),
    ],
    test: { include: ['tests/**/*.test.ts'] },
  }),
);
