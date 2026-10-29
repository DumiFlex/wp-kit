# CLAUDE.md — wp-kit conventions

Short, load-bearing notes for anyone (human or Claude) working here.

## What this repo is

The Vue 3 component kit shared by the Wildcard Pipeline extension (DumiFlex/ComfyUI-Wildcard-Pipeline: manager + canvas) and the community site (DumiFlex/Wildcard-Pipeline-Community). The apps copy `src/` in at a release tag with their own `scripts/kit-pull.mjs`; a CI check in each app fails on hand edits to the copy. So every kit change starts here.

## Rules

- `src/` is flat: one file per piece plus its helpers (`floating.ts`, `slider-math.ts` …). Tests sit next to the file or in `src/__tests__/`. The one folder is `src/theme/`: `tokens.css` (every token, dark + light, plus the base classes such as `.wp-card`, `.wp-input`, `.wp-table`, `.wp-modal` the page pieces use), `palettes.css` (`data-wp-palette`), `looks.css` (`data-wp-look`) and their fonts. Nothing outside `src/` is copied into the apps.
- Everything shared lives here: a piece that takes props and emits events goes in the kit even when one app uses it today. A piece that calls an app's API, store or router stays in that app, built from kit pieces.
- A piece imports only `vue` and other kit files, by relative path. No `@/` alias, stores, routers, ComfyUI globals or app CSS.
- CSS: scoped, every class `wp-*`. A piece that runs on the ComfyUI canvas reads only `SHARED_TOKENS` (`src/tokens.ts`); a page-only piece is listed in `PAGE_PIECES` and may read anything `src/theme/` defines (`tokens.test.ts`). No new raw hex colours; the few fixed ones (logo, colour picker, text on the accent) stay where they are.
- Corners `min(Npx, var(--wp-radius-cap, 999px))`, pills `var(--wp-radius-cap, 999px)`, circles inside controls `min(50%, var(--wp-radius-cap, 999px))`.
- Props: `size` / `variant` / `tone` / `v-model:open`; heights from `--wp-control-h-*`. Keyboard + Escape + focus return for anything interactive.
- No `as any`, `@ts-ignore`, `@ts-expect-error`. No `v-html`.
- Type-checked with `exactOptionalPropertyTypes` (the community site uses it): an optional prop or option is `name?: T | undefined`, so a parent can pass `undefined` through. In a template read a defaulted prop as `props.x` when you do maths or call a method on it.
- A new piece needs its site entry and demo in the same PR: `site/src/registry.ts` + `site/src/demos/<id>.vue` (`site/src/coverage.test.ts` fails otherwise). The site (`site/`, Vite, imports the kit through `@kit/`) is the kit's docs, deployed to GitHub Pages by `site.yml` on each release; `pnpm site:dev` to look at it.

## Workflow

- Branches `feat/x`, `fix/x`, `docs/x`, `refactor/x`, `chore/x`, `test/x` off `dev`; PRs into `dev`, squash-merged. The PR title is the commit release-please reads, so it must be a Conventional Commit.
- `dev` → `main` by a plain merge ships a release (release-please PR merges itself; tag `vX.Y.Z`; main syncs back into dev).
- Before pushing: `pnpm lint && pnpm typecheck && pnpm test && pnpm site:build`.
