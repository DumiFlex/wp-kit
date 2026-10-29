# Tokens a host defines

Kit pieces style themselves only through CSS custom properties. A host page defines every name in `SHARED_TOKENS` (`src/tokens.ts`); the kit never sets them, so the same piece looks right on the ComfyUI canvas, in the manager and on the community site.

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

To add a name: define it in every host first (the extension's `components/shared/theme.css` and `manager/styles/tokens.css`, the community's tokens), then add it to `SHARED_TOKENS` here.
