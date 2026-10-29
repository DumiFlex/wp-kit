# wp-kit

The Vue 3 component kit shared by the [Wildcard Pipeline](https://github.com/DumiFlex/ComfyUI-Wildcard-Pipeline) extension (its manager and canvas widgets) and the [Wildcard Pipeline Community](https://github.com/DumiFlex/Wildcard-Pipeline-Community) site.

Buttons, inputs, selects, checkboxes and toggles, cards, chips, tables, modals, drawers and confirm dialogs, overlays (Popover, DropdownMenu, ContextMenu, tooltip), tabs, sliders, tag, date, colour and icon pickers, lists, image grid and lightbox, toasts, diff and code views, and the logo. And the theme they wear: the design tokens, six colour palettes and seven looks in `src/theme/`.

Every piece uses CSS custom properties, so it takes on the colours, corners and type of whichever app it sits in.

## How the apps use it

The kit is not published to npm. Each app copies it in at a release tag:

```bash
node scripts/kit-pull.mjs v0.1.0   # in the app repo
```

The app's script downloads that tag, copies `src/` into the app's kit folder, and writes the tag and commit next to it. A CI check (`kit-pull.mjs --check`) fails when the copy no longer matches what was pulled, so a fix to a kit piece is made here, released, and pulled into the apps in an ordinary PR.

Pieces are imported one file at a time (`@/kit/WpButton.vue`), so an app's bundler only ships what it uses. There is no barrel file on purpose.

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

The longer component standard lives in the extension repo: `docs/component-standard.md`.

## Develop

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

Node 22+ and pnpm 9.

## Versions and releases

Commits and PR titles follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:` …); the `pr-title` check enforces it. Work goes into `dev` by squash-merged PRs. Merging `dev` into `main` ships: release-please opens a release PR with the next version and `CHANGELOG.md`, it merges itself once CI passes, and the `vX.Y.Z` tag it makes is what the apps pull. While the kit is below 1.0, a `feat` bumps the minor version and a `fix` the patch.

## License

[GPL-3.0-or-later](LICENSE). Copyright (C) 2026 DumiFlex.
