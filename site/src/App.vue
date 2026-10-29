<script setup lang="ts">
/**
 * The wp-kit showcase: every piece live, with when to use it and how to
 * write it, in the palette, look and light/dark picked in the header.
 * Entries and their text live in `registry.ts`, one demo per entry in
 * `demos/<id>.vue`; `coverage.test.ts` checks both.
 */
import { computed, onBeforeUnmount, onMounted, reactive, watch, type Component } from "vue";
import Logo from "@kit/Logo.vue";
import ToastHost from "@kit/ToastHost.vue";
import WpSegmented from "@kit/WpSegmented.vue";
import WpSelect from "@kit/WpSelect.vue";
import KitEntry from "./KitEntry.vue";
import KitTokens from "./KitTokens.vue";
import { KIT_ENTRIES, KIT_GROUPS } from "./registry";
import { LOOKS, PALETTES, applyAppearance, loadAppearance, saveAppearance, type Scheme } from "./appearance";

// One demo file per entry, named after its id (`demos/<id>.vue`), so PRs
// that add pieces don't all edit this file.
const DEMOS: Record<string, Component> = Object.fromEntries(
  Object.entries(import.meta.glob<Component>("./demos/*.vue", { eager: true, import: "default" })).map(([path, c]) => [
    path.slice(path.lastIndexOf("/") + 1, -".vue".length),
    c,
  ]),
);

const groups = computed(() =>
  KIT_GROUPS.map((g) => ({ ...g, entries: KIT_ENTRIES.filter((e) => e.group === g.id) })),
);

const appearance = reactive(loadAppearance());
const SCHEMES: { value: Scheme; label: string; icon: string }[] = [
  { value: "system", label: "System", icon: "pi-desktop" },
  { value: "dark", label: "Dark", icon: "pi-moon" },
  { value: "light", label: "Light", icon: "pi-sun" },
];

watch(appearance, (a) => {
  applyAppearance(a);
  saveAppearance({ ...a });
});

// "System" follows the OS while the page is open.
const media = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: light)") : undefined;
function onSchemeChange(): void {
  if (appearance.scheme === "system") applyAppearance(appearance);
}
onMounted(() => media?.addEventListener("change", onSchemeChange));
onBeforeUnmount(() => media?.removeEventListener("change", onSchemeChange));

const version = __KIT_VERSION__;
const REPO = "https://github.com/DumiFlex/wp-kit";
</script>

<template>
  <div class="wp-site">
    <header class="wp-site__bar">
      <a class="wp-site__brand" href="#top">
        <Logo :size="24" decorative />
        <span class="wp-site__name">wp-kit</span>
        <span class="wp-site__version">v{{ version }}</span>
      </a>
      <div class="wp-site__controls">
        <label class="wp-site__control">
          <span>Palette</span>
          <WpSelect v-model="appearance.palette" :options="PALETTES" aria-label="Palette" data-test="site-palette" />
        </label>
        <label class="wp-site__control">
          <span>Look</span>
          <WpSelect v-model="appearance.look" :options="LOOKS" aria-label="Look" data-test="site-look" />
        </label>
        <WpSegmented v-model="appearance.scheme" :options="SCHEMES" icon-only aria-label="Light or dark" test-prefix="site-scheme" />
        <a class="wp-btn wp-btn--ghost wp-btn--icon" :href="REPO" target="_blank" rel="noopener" aria-label="wp-kit on GitHub">
          <i class="pi pi-github" aria-hidden="true" />
        </a>
      </div>
    </header>

    <div id="top" class="wp-page wp-kit" data-test="kit-page">
      <div class="wp-page__header">
        <div class="wp-page__title-wrap">
          <h1 class="wp-page__title">Components</h1>
          <p class="wp-page__subtitle">
            Every piece of the kit that Wildcard Pipeline and its community site are built from, live. Pick a palette,
            a look and light or dark above to see each piece the way it shows in the app. Building a screen? Use what is
            here. When nothing fits, add the new piece to the kit with its entry on this page.
          </p>
        </div>
      </div>

      <div class="wp-kit__layout">
        <nav class="wp-kit__nav" aria-label="Kit sections">
          <a href="#kit-tokens" class="wp-kit__nav-link">Tokens</a>
          <template v-for="g in groups" :key="g.id">
            <a :href="`#kit-group-${g.id}`" class="wp-kit__nav-link">{{ g.label }}</a>
            <a v-for="e in g.entries" :key="e.id" :href="`#kit-${e.id}`" class="wp-kit__nav-link wp-kit__nav-link--sub">{{ e.name }}</a>
          </template>
        </nav>

        <main class="wp-kit__main">
          <section class="wp-kit__group">
            <h2 class="wp-kit__group-title">Tokens</h2>
            <p class="wp-kit__group-blurb">Colours, type and spacing. Use a token, never a raw colour or size.</p>
            <KitTokens />
          </section>

          <section v-for="g in groups" :id="`kit-group-${g.id}`" :key="g.id" class="wp-kit__group" :data-kit-group="g.id">
            <h2 class="wp-kit__group-title">{{ g.label }}</h2>
            <p class="wp-kit__group-blurb">{{ g.blurb }}</p>

            <KitEntry v-for="e in g.entries" :id="e.id" :key="e.id">
              <component :is="DEMOS[e.id]" />
            </KitEntry>
          </section>
        </main>
      </div>
    </div>

    <footer class="wp-site__foot">
      <span>wp-kit v{{ version }} · GPL-3.0-or-later · made by <a href="https://github.com/DumiFlex" target="_blank" rel="noopener">DumiFlex</a></span>
    </footer>
    <ToastHost />
  </div>
</template>

<style>
/* Not scoped: the demos in kit/demos use these helper classes. */
.wp-kit__layout {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: var(--wp-space-7);
  align-items: start;
}
.wp-kit__nav {
  position: sticky;
  top: calc(var(--wp-site-bar-h) + var(--wp-space-6));
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: calc(100vh - var(--wp-site-bar-h) - 48px);
  overflow-y: auto;
}
.wp-kit__nav-link {
  padding: 4px 8px;
  border-radius: var(--wp-radius-sm);
  color: var(--wp-text);
  font-size: var(--wp-text-sm);
  font-weight: 600;
  text-decoration: none;
}
.wp-kit__nav-link--sub { font-weight: 400; color: var(--wp-text-muted); padding-left: 16px; }
.wp-kit__nav-link:hover { background: var(--wp-bg-3); color: var(--wp-text); }
.wp-kit__main { display: flex; flex-direction: column; gap: var(--wp-space-8); min-width: 0; }
.wp-kit__group { display: flex; flex-direction: column; gap: var(--wp-space-5); scroll-margin-top: 80px; }
.wp-kit__group-title { margin: 0; font-size: var(--wp-text-lg); font-weight: 600; color: var(--wp-text); }
.wp-kit__group-blurb { margin: calc(-1 * var(--wp-space-3)) 0 0; color: var(--wp-text-muted); font-size: var(--wp-text-sm); }
.wp-kit__stack { display: flex; flex-direction: column; gap: var(--wp-space-4); width: 100%; max-width: 420px; }
.wp-kit__stack--wide { max-width: 720px; }
.wp-kit__row { display: flex; align-items: center; gap: var(--wp-space-4); flex-wrap: wrap; }
.wp-kit__inline { display: inline-flex; align-items: center; gap: var(--wp-space-3); color: var(--wp-text); font-size: var(--wp-text-base); }
.wp-kit__muted { margin: 0; color: var(--wp-text-muted); font-size: var(--wp-text-sm); }
.wp-kit__compact { width: 160px; height: 28px; }
.wp-kit__hsv { width: 240px; }
.wp-kit__menu-col { display: flex; flex-direction: column; gap: var(--wp-space-2); min-width: 180px; }
.wp-kit__target {
  display: grid; place-items: center; width: 100%; max-width: 420px; height: 96px;
  border: 1px dashed var(--wp-border-strong); border-radius: var(--wp-radius-md);
  background: transparent; color: var(--wp-text-muted); font: inherit; font-size: var(--wp-text-sm); cursor: context-menu;
}
.wp-kit__canvas-dialog {
  display: flex; flex-direction: column; align-items: flex-start; gap: 12px; max-width: 360px; padding: 16px;
  background: var(--wp-bg-2); border: 1px solid var(--wp-border-strong); border-radius: var(--wp-radius-lg); box-shadow: var(--wp-shadow-lg); color: var(--wp-text); font-size: var(--wp-text-sm);
}
/* How a shared piece sits on a node: its canvas size on a node-like panel
   (manager colours; the canvas sheet never loads here). */
.wp-kit__canvas {
  display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 420px; padding: 12px;
  background: var(--wp-bg); border: 1px solid var(--wp-border); border-radius: var(--wp-radius);
  color: var(--wp-text); font-size: 12px;
}
.wp-kit__tab-panel { padding-top: var(--wp-space-5); }
.wp-kit__caption { margin: 0; color: var(--wp-text-dim); font-size: var(--wp-text-xs); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
.wp-kit__list { margin: 0; padding-left: 18px; color: var(--wp-text-muted); font-size: var(--wp-text-sm); }
.wp-kit__icons {
  list-style: none; margin: 0; padding: 0;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: var(--wp-space-3);
}
.wp-kit__icons li {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: var(--wp-space-3); color: var(--wp-text); font-size: var(--wp-text-xs);
}
.wp-kit__icons span { color: var(--wp-text-dim); font-family: var(--wp-font-mono); }
/* After the base rules so it wins. */
@media (max-width: 900px) {
  .wp-kit__layout { grid-template-columns: minmax(0, 1fr); }
  .wp-kit__nav { display: none; }
}
</style>
