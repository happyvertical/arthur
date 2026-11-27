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
build workflow all come from smrt. Not final yet:

- `productId`, `bundleId` (`com.happyvertical.arthur`) and `displayName` are provisional until the
  owner confirms them. Do not release before then: installed apps cannot cleanly change them.
- `updaterPublicKey` is deliberately absent. Unsigned builds carry smrt's invalid placeholder key,
  and a release run refuses until this app's own public key is committed.
- The icons are drawn from the app's favicon and can be replaced.

The `@happyvertical/smrt-*` pins, `smrt_desktop_version` and the workflow commit SHA in
`.github/workflows/desktop.yml` move together.
