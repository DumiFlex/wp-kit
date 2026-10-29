# Tokens and the theme

Kit pieces style themselves only through CSS custom properties.

## A page app: load the kit's theme

`src/theme/tokens.css` defines every token (dark on `:root`, light on `.wp-theme-light`) and the base classes the page pieces use. On top of it:

- `src/theme/palettes.css`: colour palettes on `<html data-wp-palette="native|nebula|tide|ember|contrast">` (Orbit is tokens.css itself).
- `src/theme/looks.css`: looks on `<html data-wp-look="crisp|soft|terminal|editorial|compact|tui">` (Orbit is the default). A look sets corners, type, borders and selection; it never sets a colour.
- Light or dark: the `wp-theme-light` class on `<html>`. Many rules also key on `html.wp-manager`, so a page app sets that class too.

Load order: `tokens.css`, `palettes.css`, `looks.css`, then `button.css`.

## A host with its own colours (the canvas)

The ComfyUI canvas keeps its own colour sheet. It defines every name in `SHARED_TOKENS` (`src/tokens.ts`), and the canvas only uses pieces that read nothing else (everything not in `PAGE_PIECES`). These are the shared names:

| Group | Names |
|---|---|
| Surfaces and text | `--wp-bg`, `--wp-bg-1` … `--wp-bg-4`, `--wp-text`, `--wp-text-muted`, `--wp-text-dim`, `--wp-border`, `--wp-border-strong`, `--wp-border-soft`, `--wp-border-focus`, `--wp-overlay-bg`, `--wp-row-hover`, `--wp-input-shade`, `--wp-scrollbar-thumb` |
| Accent and states | `--wp-accent`, `--wp-accent-glow`, `--wp-accent-text`, `--wp-accent-text-strong`, `--wp-accent-300` … `--wp-accent-800`, `--wp-focus-ring`, `--wp-success`, `--wp-warn`, `--wp-danger`, `--wp-info`, `--wp-danger-text`, `--wp-error-border`, `--wp-error-text`, and the `--wp-red|green|amber|teal|violet|rose` pairs (`…` and `…-bg`) |
| Kinds and variables | `--wp-kind-wildcard|fixed|combine|derivation|constraint`, `--wp-var-1` … `--wp-var-8` |
| Shape and depth | `--wp-radius-sm|-|md|lg|xl`, `--wp-radius-cap`, `--wp-shadow-sm|-|md|lg|xl` |
| Type and space | `--wp-font-sans`, `--wp-font-mono`, `--wp-text-xs|sm|base|md|lg|xl`, `--wp-space-0` … `--wp-space-8` |
| Controls | `--wp-control-h-sm|md|lg` (24 / 32 / 40 px by default) |
| Motion | `--wp-motion-quick|hover|shimmer|fade|swap|flip`, `--wp-motion-curve-collapse|flip|linear` |

`--wp-radius-cap` is how a look changes corners: every fixed corner in the kit is `min(Npx, var(--wp-radius-cap, 999px))`, so a host sets it to `0` for square corners or `4px` for crisp ones and leaves it unset otherwise.

Two more names are optional (`OPTIONAL_TOKENS`): `--wp-bg-deep` (read with a fallback) and `--wp-bg2` (an older alias of `--wp-bg-2` that `_skeleton.css` still reads).

To add a shared name: define it in `src/theme/tokens.css` and in the canvas sheet (the extension's `components/shared/theme.css`) first, then add it to `SHARED_TOKENS` here.
