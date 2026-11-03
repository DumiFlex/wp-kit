<script setup lang="ts">
/**
 * A grid of image tiles that fills its width (tiles at least `min-size`
 * wide). A click or Enter opens the image in a Lightbox, where ← / → step
 * through the rest. With `selectable` each tile gets a check box in its
 * corner and `v-model:selected` holds the picked ids.
 *
 *   <ImageGrid :images="outputs" />
 *   <ImageGrid v-model:selected="keep" :images="frames" selectable :min-size="96" />
 *
 * Tiles are buttons in reading order (one Tab stop each). A tile with no
 * `src` yet (a frame still rendering) draws a Skeleton and can't be opened;
 * the Lightbox steps only through the images that are there.
 *
 * `aspect="auto"` keeps each picture's own shape, `columns` fixes the column
 * count and `hint` puts a magnifier on a tile under the pointer, so one
 * screenshot that opens full size is `<ImageGrid :images="[shot]" aspect="auto"
 * :columns="1" hint />`. A picture that fails to load emits `error`.
 */
import { computed, ref } from "vue";
import Lightbox from "./Lightbox.vue";
import Icon from "./Icon.vue";
import Skeleton from "./Skeleton.vue";
import Checkbox from "./Checkbox.vue";

export interface GridImage { id: string; src: string; alt: string; thumb?: string; caption?: string }

const props = withDefaults(defineProps<{
  images: GridImage[];
  /** Smallest tile width in px. */
  minSize?: number | undefined;
  /** Width / height of a tile; `"auto"` keeps each picture's own shape (no crop). */
  aspect?: number | "auto" | undefined;
  /** A fixed number of columns instead of as many as fit `minSize` (1 = one picture full width). */
  columns?: number | undefined;
  /** A magnifier in the corner of each tile on hover and focus. */
  hint?: boolean | undefined;
  gap?: "sm" | "md" | undefined;
  selectable?: boolean | undefined;
  selected?: string[] | undefined;
  /** Open the Lightbox on a click (off: emit `open` and do your own thing). */
  lightbox?: boolean | undefined;
  ariaLabel?: string | undefined;
}>(), { minSize: 120, aspect: 1, gap: "md", selectable: false, selected: () => [], lightbox: true, ariaLabel: "Images" });

const emit = defineEmits<{
  (e: "update:selected", v: string[]): void;
  (e: "open", index: number): void;
  /** A picture failed to load. */
  (e: "error", index: number): void;
}>();

const open = ref(false);
const at = ref(0);
/** Only the images that are there: a tile still loading has nothing to show. */
const ready = computed(() => props.images.map((img, i) => ({ img, i })).filter(({ img }) => !!img.src));
const shots = computed(() => ready.value.map(({ img }) => ({ src: img.src, alt: img.alt, caption: img.caption })));

function show(i: number): void {
  if (!props.images[i]?.src) return;
  emit("open", i);
  if (!props.lightbox) return;
  at.value = ready.value.findIndex((r) => r.i === i);
  open.value = true;
}

function toggle(id: string, on: boolean): void {
  emit("update:selected", on ? [...props.selected, id] : props.selected.filter((x) => x !== id));
}
</script>

<template>
  <div class="wp-image-grid">
  <ul
    class="wp-image-grid__list"
    :data-gap="gap"
    :aria-label="ariaLabel"
    :data-aspect="aspect === 'auto' ? 'auto' : undefined"
    :style="{
      '--_min': `${minSize}px`,
      '--_aspect': String(aspect),
      ...(columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : {}),
    }"
  >
    <li
      v-for="(img, i) in images"
      :key="img.id"
      class="wp-image-grid__tile"
      :data-selected="(selectable && props.selected.includes(img.id)) || undefined"
    >
      <button
        type="button"
        class="wp-image-grid__open"
        :aria-label="!img.src ? `${img.alt}, still loading` : selectable ? `Open ${img.alt}` : img.alt"
        :aria-disabled="!img.src || undefined"
        :data-loading="!img.src || undefined"
        @click="show(i)"
      >
        <img v-if="img.thumb || img.src" class="wp-image-grid__img" :src="img.thumb || img.src" alt="" loading="lazy" @error="emit('error', i)">
        <span v-if="hint && img.src" class="wp-image-grid__hint" aria-hidden="true"><Icon name="search-plus" :size="12" /></span>
        <Skeleton v-else class="wp-image-grid__empty" shape="block" width="100%" height="100%" />
      </button>
      <Checkbox
        v-if="selectable"
        class="wp-image-grid__check"
        :model-value="props.selected.includes(img.id)"
        :aria-label="`Select ${img.alt}`"
        @update:model-value="toggle(img.id, $event)"
      />
      <span v-if="img.caption" class="wp-image-grid__caption">{{ img.caption }}</span>
    </li>
  </ul>
  <Lightbox v-if="lightbox" v-model:open="open" v-model:index="at" :images="shots" />
  </div>
</template>

<style scoped>
.wp-image-grid { min-width: 0; }
.wp-image-grid__list {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(var(--_min), 1fr));
  gap: var(--wp-space-3); margin: 0; padding: 0; list-style: none;
}
.wp-image-grid__list[data-gap="sm"] { gap: var(--wp-space-1); }
.wp-image-grid__tile { position: relative; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.wp-image-grid__open {
  display: block; width: 100%; aspect-ratio: var(--_aspect); padding: 0; overflow: hidden;
  border: 1px solid var(--wp-border); border-radius: var(--wp-radius);
  background: var(--wp-bg-2); cursor: zoom-in;
  transition: border-color var(--wp-motion-hover), box-shadow var(--wp-motion-hover);
}
.wp-image-grid__open:hover { border-color: var(--wp-border-strong); }
.wp-image-grid__open:focus-visible { outline: none; border-color: var(--wp-border-focus); box-shadow: var(--wp-focus-ring); }
.wp-image-grid__tile[data-selected] .wp-image-grid__open { border-color: var(--wp-accent); box-shadow: 0 0 0 2px var(--wp-accent-glow); }
.wp-image-grid__img { display: block; width: 100%; height: 100%; object-fit: cover; }
.wp-image-grid__list[data-aspect="auto"] .wp-image-grid__open { position: relative; aspect-ratio: auto; }
.wp-image-grid__list[data-aspect="auto"] .wp-image-grid__img { height: auto; }
.wp-image-grid__open { position: relative; }
.wp-image-grid__hint {
  position: absolute; top: 8px; right: 8px; display: grid; place-items: center; width: 24px; height: 24px;
  border-radius: min(6px, var(--wp-radius-cap, 999px)); background: var(--wp-scrim); color: var(--wp-on-media);
  opacity: 0; transition: opacity var(--wp-motion-hover);
}
.wp-image-grid__open:hover .wp-image-grid__hint, .wp-image-grid__open:focus-visible .wp-image-grid__hint { opacity: 1; }
.wp-image-grid__open[data-loading] { cursor: progress; }
.wp-image-grid__empty { width: 100%; height: 100%; }
.wp-image-grid__check { position: absolute; top: 6px; left: 6px; }
.wp-image-grid__caption {
  overflow: hidden; color: var(--wp-text-muted); font: 400 var(--wp-text-xs)/1.3 var(--wp-font-sans);
  text-overflow: ellipsis; white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) {
  .wp-image-grid__open, .wp-image-grid__hint { transition: none; }
}
</style>
