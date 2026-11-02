# wp-kit

[![npm](https://img.shields.io/npm/v/@dumiflex/wp-kit?logo=npm&label=npm)](https://www.npmjs.com/package/@dumiflex/wp-kit)
[![CI](https://github.com/DumiFlex/wp-kit/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/DumiFlex/wp-kit/actions/workflows/ci.yml)
[![Site](https://github.com/DumiFlex/wp-kit/actions/workflows/site.yml/badge.svg)](https://dumiflex.github.io/wp-kit/)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: GPL-3.0-or-later](https://img.shields.io/npm/l/@dumiflex/wp-kit)](LICENSE)

The Vue 3 component kit shared by the [Wildcard Pipeline](https://github.com/DumiFlex/ComfyUI-Wildcard-Pipeline) extension (its manager and canvas widgets) and the [Wildcard Pipeline Community](https://github.com/DumiFlex/Wildcard-Pipeline-Community) site.

Buttons, inputs, selects, checkboxes and toggles, cards, chips, tables, modals, drawers and confirm dialogs, overlays (Popover, DropdownMenu, ContextMenu, tooltip), tabs, sliders, tag, date, colour and icon pickers, lists, image grid and lightbox, toasts, diff and code views, and the logo. And the theme they wear: the design tokens, six colour palettes and seven looks in `src/theme/`.

Every piece uses CSS custom properties, so it takes on the colours, corners and type of whichever app it sits in.

**See every piece live:** [dumiflex.github.io/wp-kit](https://dumiflex.github.io/wp-kit/), with a switcher for the palette, the look and light or dark.

## Install

The kit is on npm as [`@dumiflex/wp-kit`](https://www.npmjs.com/package/@dumiflex/wp-kit). It ships its source (`.vue`, `.ts` and the theme CSS) with no build step, so your Vite app compiles the pieces it imports with its own Vue plugin:

```bash
pnpm add @dumiflex/wp-kit vue primeicons
```

```ts
import Button from "@dumiflex/wp-kit/Button.vue";
import { SHARED_TOKENS } from "@dumiflex/wp-kit/tokens.ts";
import "@dumiflex/wp-kit/theme/tokens.css";
```

Import one file at a time (there is no barrel file, on purpose), so the bundler ships only what you use. In `vite.config`, set `resolve.dedupe: ["vue"]` (one Vue, not the app's and a second one) and `optimizeDeps.exclude: ["@dumiflex/wp-kit"]` (the `.vue` sources go through your Vue plugin, not the pre-bundler). An app that already imports the kit as `@/kit/...` can keep that by aliasing `@/kit` to `node_modules/@dumiflex/wp-kit/src`.

Each release is staged on npm by the release workflow (trusted publishing, with provenance) and goes live once a maintainer approves it.

### Apps that copy the kit

The Wildcard Pipeline apps still copy `src/` in at a release tag until they move to the package:

```bash
node scripts/kit-pull.mjs v0.2.1   # in the app repo
```

The app's script downloads that tag, copies `src/` into the app's kit folder, and writes the tag and commit next to it. A CI check (`kit-pull.mjs --check`) fails when the copy no longer matches what was pulled, so a fix to a kit piece is made here, released, and pulled into the apps in an ordinary PR.

## What a host must provide

- **Vue 3.5** and **PrimeIcons 7** (peer dependencies; icons are `pi pi-*` classes). The kit imports nothing else at runtime.
- **A theme.** A page app loads the kit's own: `theme/tokens.css`, then `theme/palettes.css` and `theme/looks.css`, and `button.css`. It sets `data-wp-palette`, `data-wp-look` and `wp-theme-light` on `<html>` to switch them (see [docs/tokens.md](docs/tokens.md)). A host with its own colour sheet (the ComfyUI canvas) defines the names in `SHARED_TOKENS` ([`src/tokens.ts`](src/tokens.ts)) instead, and uses only the pieces that read nothing else.
- **`button.css`** loaded once globally if the app uses the `.wp-btn` classes on plain elements. `WpButton` pulls it in on its own.

## Rules for a piece

- Reads only the shared token names, or, for a piece listed in `PAGE_PIECES`, names `src/theme/` defines (`src/tokens.test.ts` fails otherwise).
- Every class starts with `wp-`.
- Fixed corners are `min(Npx, var(--wp-radius-cap, 999px))`, pills `var(--wp-radius-cap, 999px)`, so a host's look can square them off.
- Props use the shared names `size` / `variant` / `tone` / `v-model:open`; heights come from `--wp-control-h-sm|md|lg` (24 / 32 / 40 px).
- Overlays place themselves through `floating.ts` and handle Escape, Tab and focus return through `useDialogFocus`.
- No app code: no stores, routers, ComfyUI globals or `@/` imports. A piece only imports `vue` and other kit files.

Every piece has an entry and a demo on the site (`site/src/registry.ts` + `site/src/demos/<id>.vue`); `site/src/coverage.test.ts` fails when one is missing. The longer component standard lives in the extension repo: `docs/component-standard.md`.

## Develop

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm site:dev     # the showcase site on localhost
pnpm site:build   # site/dist, what Pages serves
pnpm check-package  # what npm would publish: the files apps import, nothing repo-only
```

Node 22+ and pnpm 9. The site lives in `site/` (outside `src/`, so the apps never copy it). It is deployed to GitHub Pages by `.github/workflows/site.yml` on every release and on "Run workflow"; CI builds it on every PR.

## Versions and releases

Commits and PR titles follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:` …); the `pr-title` check enforces it. Work goes into `dev` by squash-merged PRs. Merging `dev` into `main` ships: release-please opens a release PR with the next version and `CHANGELOG.md`, it merges itself once CI passes, and the `vX.Y.Z` tag it makes is what the apps pull. While the kit is below 1.0, a `feat` bumps the minor version and a `fix` the patch.

## License

[GPL-3.0-or-later](LICENSE). Copyright (C) 2026 DumiFlex.
