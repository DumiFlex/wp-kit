# CLAUDE.md — wp-kit conventions

Short, load-bearing notes for anyone (human or Claude) working here.

## What this repo is

The Vue 3 component kit shared by the Wildcard Pipeline extension (DumiFlex/ComfyUI-Wildcard-Pipeline: manager + canvas) and the community site (DumiFlex/Wildcard-Pipeline-Community). The apps copy `src/` in at a release tag with their own `scripts/kit-pull.mjs`; a CI check in each app fails on hand edits to the copy. So every kit change starts here.

## Rules

- `src/` is flat: one file per piece plus its helpers (`floating.ts`, `slider-math.ts` …). Tests sit next to the file or in `src/__tests__/`. Nothing outside `src/` is copied into the apps.
- A piece imports only `vue` and other kit files, by relative path. No `@/` alias, stores, routers, ComfyUI globals or app CSS.
- CSS: scoped, every class `wp-*`, colours and sizes only from the names in `src/tokens.ts` (`tokens.test.ts`). No new raw hex colours; the few fixed ones (logo, colour picker, text on the accent) stay where they are.
- Corners `min(Npx, var(--wp-radius-cap, 999px))`, pills `var(--wp-radius-cap, 999px)`, circles inside controls `min(50%, var(--wp-radius-cap, 999px))`.
- Props: `size` / `variant` / `tone` / `v-model:open`; heights from `--wp-control-h-*`. Keyboard + Escape + focus return for anything interactive.
- No `as any`, `@ts-ignore`, `@ts-expect-error`. No `v-html`.
- A new piece also needs its kit-page entry and demo in the extension (`src/manager/kit/registry.ts` + `demos/<id>.vue`) when that app pulls the version that adds it.

## Workflow

- Branches `feat/x`, `fix/x`, `docs/x`, `refactor/x`, `chore/x`, `test/x` off `dev`; PRs into `dev`, squash-merged. The PR title is the commit release-please reads, so it must be a Conventional Commit.
- `dev` → `main` by a plain merge ships a release (release-please PR merges itself; tag `vX.Y.Z`; main syncs back into dev).
- Before pushing: `pnpm lint && pnpm typecheck && pnpm test`.
