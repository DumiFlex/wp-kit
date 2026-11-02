# @dumiflex/wp-kit

[![npm](https://img.shields.io/npm/v/@dumiflex/wp-kit?logo=npm&label=npm)](https://www.npmjs.com/package/@dumiflex/wp-kit)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: GPL-3.0-or-later](https://img.shields.io/npm/l/@dumiflex/wp-kit)](https://github.com/DumiFlex/wp-kit/blob/main/LICENSE)

A Vue 3 component kit with its own theme: buttons, fields, selects, checkboxes, switches, chips, cards, tables, dialogs, drawers, popovers, menus, tooltips, tabs, sliders, colour, date and icon pickers, lists, toasts, code and diff views. The theme is design tokens, six colour palettes and seven looks (corners, type, borders). It was built for [Wildcard Pipeline](https://github.com/DumiFlex/ComfyUI-Wildcard-Pipeline), a ComfyUI extension, and works in any Vue 3 + Vite app.

Every piece reads CSS custom properties, so it takes on the colours, corners and type of the app it sits in.

**See every piece live, with when to use it:** [dumiflex.github.io/wp-kit](https://dumiflex.github.io/wp-kit/). The site has a switcher for the palette, the look and light or dark.

## Install

```bash
npm install @dumiflex/wp-kit vue primeicons
# or: pnpm add @dumiflex/wp-kit vue primeicons
```

The package ships source (`.vue`, `.ts` and CSS) with no build step, and your Vite app compiles the pieces it imports. In `vite.config`:

```ts
export default defineConfig({
  plugins: [vue()],
  resolve: { dedupe: ["vue"] },                     // one Vue, yours
  optimizeDeps: { exclude: ["@dumiflex/wp-kit"] },  // .vue files go through your Vue plugin
});
```

## Use

Import one file at a time. There is no barrel file, so the bundler only ships what you use:

```ts
import "primeicons/primeicons.css";
import "@dumiflex/wp-kit/theme/tokens.css";
import "@dumiflex/wp-kit/theme/palettes.css";
import "@dumiflex/wp-kit/theme/looks.css";
import "@dumiflex/wp-kit/button.css";

import Button from "@dumiflex/wp-kit/Button.vue";
import Chip from "@dumiflex/wp-kit/Chip.vue";
```

```vue
<Button variant="primary" icon="pi-plus" @click="add">Add</Button>
<Chip tone="warn" icon="pi-exclamation-triangle">2 conflicts</Chip>
<Chip :pressed="tag === 'portrait'" :count="12" size="sm" @click="tag = 'portrait'">portrait</Chip>
```

Pick a palette and a look on `<html>`: `data-wp-palette="…"`, `data-wp-look="…"`, and the class `wp-theme-light` for light mode. The site lists them all and shows each piece's props and an example.

If you already import the kit as `@/kit/...`, alias `@/kit` to `node_modules/@dumiflex/wp-kit/src`.

## What your app provides

- **Vue 3.5** and **PrimeIcons 7** (peer dependencies). Icons are `pi pi-*` classes. The kit imports nothing else at runtime.
- **A theme:** the kit's own sheets above. A host with its own colour sheet can define the names in [`SHARED_TOKENS`](https://github.com/DumiFlex/wp-kit/blob/main/src/tokens.ts) instead and use the pieces that read only those.
- **A layer order, if your app uses cascade layers** (Tailwind 4 does). A few pieces (the tooltip, Popover, DropdownMenu, the entrance classes) put their rules in `@layer wp-extension`, so a host page's unlayered CSS wins a clash (that keeps the kit polite on the ComfyUI canvas). Their outlines are drawn as rings, so a reset like Tailwind's preflight (`border-width: 0`) can't strip them. If your own CSS is layered, declare the order in your page's `<head>`, before any stylesheet, with the kit above your reset and below your utilities:

  ```html
  <style>@layer theme, base, wp-extension, components, utilities;</style>
  ```

## Versions

[Semantic versioning](https://semver.org/). Below 1.0, a minor version can break: read the [changelog](https://github.com/DumiFlex/wp-kit/blob/main/CHANGELOG.md) before you bump. Each release is published from CI with provenance.

## Links

- [Live components](https://dumiflex.github.io/wp-kit/)
- [Source and issues](https://github.com/DumiFlex/wp-kit)
- [Changelog](https://github.com/DumiFlex/wp-kit/blob/main/CHANGELOG.md)

## License

[GPL-3.0-or-later](https://github.com/DumiFlex/wp-kit/blob/main/LICENSE). Copyright (C) 2026 DumiFlex.
