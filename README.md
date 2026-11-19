# Arthur

[Home page](https://arthur.happyvertical.com)

Arthur is an open source desktop app for one person: the owner. He is being built to assemble a
local business app from real [smrt](https://github.com/happyvertical/smrt) packages, recipes and
cookbooks, which are ready-made building blocks and starting templates for a business. The app
starts empty, and the owner shapes it by talking to a built-in assistant. The owner directs every
change, and risky changes wait for their approval. Data lives in a local database on the owner's
machine, and the assistant runs on the owner's own AI account.

Arthur is built on the full smrt toolkit. His sibling, [Tricia](https://github.com/happyvertical/tricia),
builds herself from the spreadsheets a business already runs on.

## Status

Arthur is **not released yet**. There is no installer, and signing is not done. The platform work
he depends on is not released either. Only macOS and Linux are planned so far, and optional cloud
services are planned and not built.

The app's source is now in this repository, in [`apps/app`](apps/app), and you can run it from
a checkout (see below). This README has no screenshots yet. Download and documentation pages, and
screenshots of the real app, will be added later.

## What is in this repository

- [`apps/web`](apps/web): the homepage, a static SvelteKit site served at
  [arthur.happyvertical.com](https://arthur.happyvertical.com).
- [`apps/app`](apps/app): the Arthur app, a SvelteKit app built on the published
  `@happyvertical/smrt-*` packages.
- Releases and the update feed for the desktop app will be published here once there is a release.

## Working on the homepage

You need Node 26 and pnpm 11.

```sh
pnpm install
pnpm dev         # local dev server
pnpm build       # static site in apps/web/build
pnpm typecheck
pnpm lint        # Biome
```

See [`apps/web/README.md`](apps/web/README.md) for details.

## Working on the app

```sh
pnpm install
pnpm dev:app         # app dev server on http://localhost:4910
pnpm test:app        # unit tests, in process, no containers
pnpm typecheck       # includes the app
pnpm build           # builds the site and the app
```

Copy `apps/app/.env.example` to `apps/app/.env` to supply an assistant key. The app keeps its data
in a local SQLite database in your operating system's data directory.

## Contributing and issues

Please [open an issue](https://github.com/happyvertical/arthur/issues) to report a problem or
suggest a change, and open a pull request against `main` with checks passing (`pnpm lint`,
`pnpm typecheck`, `pnpm build`). Changes to the shared toolkit belong in the
[smrt repository](https://github.com/happyvertical/smrt).

## Licence

MIT. See [LICENSE](LICENSE).
