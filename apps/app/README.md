# @arthur/app

The Arthur app: a local-first business app assembled from the published `@happyvertical/smrt-*`
packages. Run `pnpm dev:app` from the repository root, or `pnpm dev` in this folder.

This folder is a standalone pnpm project with its own lockfile (the desktop bundler needs one):
run `pnpm install` here, or `pnpm install:app` from the repository root.

- `pnpm test` runs the unit tests in process.
- `pnpm typecheck` runs SvelteKit sync, `tsc` and `svelte-check`.
- `pnpm build` builds the Node server.

See the repository README for setup.

## Desktop packaging

`smrt-desktop.json` and `icons/` are the only desktop-specific files: the wrapper, bundler and
build workflow all come from smrt.

- Product identity (decided by the owner): `productId` `arthur`, `bundleId`
  `com.happyvertical.arthur`, `displayName` `Arthur`. The `bundleId` is permanent: it must not
  change after the first signed release.
- `updaterPublicKey` is the public half of Arthur's own updater key (minisign key ID
  `96D5CE992D73A585`). The private key and password are not in this repository; a release run
  refuses until they and the Apple secrets are in the protected `desktop-release` environment.
- The icons are drawn from the app's favicon and can be replaced.

The `@happyvertical/smrt-*` pins, `smrt_desktop_version` and the workflow commit SHA in
`.github/workflows/desktop.yml` move together.
