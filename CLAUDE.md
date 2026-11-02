# CLAUDE.md — wp-kit conventions

Short, load-bearing notes for anyone (human or Claude) working here.

## What this repo is

The Vue 3 component kit shared by the Wildcard Pipeline extension (DumiFlex/ComfyUI-Wildcard-Pipeline: manager + canvas) and the community site (DumiFlex/Wildcard-Pipeline-Community). It is published to npm as `@dumiflex/wp-kit` (source, no build: `files` is `src/` minus tests, `exports` maps `./*` to `./src/*`); the release workflow stages each version with trusted publishing and a maintainer approves it on npmjs.com. Both apps install it from npm, so every kit change starts here. The npm page shows `docs/npm-readme.md` (for people installing the kit; absolute links only), which the release job copies over `README.md` before staging; the repository README is for working on the kit.

## Rules

- `src/` is flat: one file per piece plus its helpers (`floating.ts`, `slider-math.ts` …). Tests sit next to the file or in `src/__tests__/`. The one folder is `src/theme/`: `tokens.css` (every token, dark + light, plus the base classes such as `.wp-card`, `.wp-input`, `.wp-table`, `.wp-modal` the page pieces use), `palettes.css` (`data-wp-palette`), `looks.css` (`data-wp-look`) and their fonts. Nothing outside `src/` is copied into the apps.
- Everything that can be shared lives here, even when one app uses it today, so one kit release reaches both apps. Only code that calls an app's API, store or router stays in that app, built from kit pieces.
- One piece per job, no near-duplicates. Before adding a piece, look on the kit site for one that already does the job; a piece that overlaps another becomes a prop or mode of it (RangeSlider became Slider with a `[low, high]` v-model), and a wrapper that only fixes props is no piece (pass the props; lookup logic goes in a helper `.ts`). Unused pieces may stay.
- A piece imports only `vue` and other kit files, by relative path. No `@/` alias, stores, routers, ComfyUI globals or app CSS.
- CSS: scoped, every class `wp-*`. A piece that runs on the ComfyUI canvas reads only `SHARED_TOKENS` (`src/tokens.ts`); a page-only piece is listed in `PAGE_PIECES` and may read anything `src/theme/` defines (`tokens.test.ts`). No new raw hex colours; the few fixed ones (logo, colour picker, text on the accent) stay where they are.
- Corners `min(Npx, var(--wp-radius-cap, 999px))`, pills `var(--wp-radius-cap, 999px)`, circles inside controls `min(50%, var(--wp-radius-cap, 999px))`.
- Props: `size` / `variant` / `tone` / `v-model:open`; heights from `--wp-control-h-*`. Keyboard + Escape + focus return for anything interactive.
- No `as any`, `@ts-ignore`, `@ts-expect-error`. No `v-html`. No non-null assertions (`x!`), tests included: use `?.` or a `must()` helper.
- Lint holds the kit to the apps' ratchet (they install it from npm and don't lint it): non-null assertions and the a11y rules (click/mouse key events, static-element interactions, interactive focus, label-has-for) are errors. A real exception (a backdrop that only takes clicks, a role the rule can't see because it's bound) gets an `eslint-disable-next-line` with its reason in a comment above it.
- Type-checked with `exactOptionalPropertyTypes` (the community site uses it): an optional prop or option is `name?: T | undefined`, so a parent can pass `undefined` through. In a template read a defaulted prop as `props.x` when you do maths or call a method on it.
- A new piece needs its site entry and demo in the same PR: `site/src/registry.ts` + `site/src/demos/<id>.vue` (`site/src/coverage.test.ts` fails otherwise). Each entry's `usedBy` names the apps that import it today (`"extension"` / `"community"`, an app file outside its tests and kit demos importing `@/kit/<file>`); it is information, not a gate: an empty list is allowed and the site shows "Not used by an app yet". Update it when an app starts or stops using a piece. The site (`site/`, Vite, imports the kit through `@kit/`) is the kit's docs, deployed to GitHub Pages by `site.yml` on each release; `pnpm site:dev` to look at it.

## Workflow

- Branches `feat/x`, `fix/x`, `docs/x`, `refactor/x`, `chore/x`, `test/x` off `dev`; PRs into `dev`, squash-merged. The PR title is the commit release-please reads, so it must be a Conventional Commit.
- `dev` → `main` by a plain merge ships a release (release-please PR merges itself; tag `vX.Y.Z`; main syncs back into dev).
- Before pushing: `pnpm lint && pnpm typecheck && pnpm test && pnpm site:build && pnpm check-package`.
- A new top-level folder under `src/`, or a file an app imports that `check-package` doesn't list, is fine as long as `files` still ships it: run `pnpm check-package` and read the list.
