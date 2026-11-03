<script setup lang="ts">
/**
 * The one pill in the kit: a tag, a status, a count, a category, a module
 * type, a filter you turn on and off. Everything else is a prop:
 *
 *   <Chip>portrait</Chip>                                  a label
 *   <Chip tone="warn" icon="pi-exclamation-triangle">2 conflicts</Chip>
 *   <Chip :color="cat.color" :icon="cat.icon">{{ cat.name }}</Chip>
 *   <Chip :color="kindColour(type)">{{ type }}</Chip>      a module type
 *   <Chip tone="success" dot>recommended</Chip>
 *   <Chip removable @remove="drop(t)">{{ t }}</Chip>
 *   <Chip as="button" icon="tag" @click="open(t)">{{ t }}</Chip>   takes you somewhere
 *   <Chip :pressed="tag === t" :count="12" size="sm" @click="pick(t)">{{ t }}</Chip>   a filter
 *
 * `pressed` (true or false) makes it a toggle: a `<button>` with
 * `aria-pressed`, neutral when off and lit in the accent (or `color`) when
 * on; with `color` its icon wears the colour even when off, so a row of type
 * filters reads at a glance. `count` puts a small number after the label.
 * `size`: `xs` (default, a label in a line of text), `sm` (24px, a filter
 * row) or `md` (32px, next to a md control).
 *
 * `variant="stat"` is the same chip as a tile: the `count` big on top, the
 * label under it and a top edge in `color` (a summary row whose tiles also
 * filter the list below):
 *
 *   <Chip variant="stat" :color="roleColour(r)" :count="n" :pressed="on.has(r)" @click="flip(r)">{{ label }}</Chip>
 */
import { computed, type Component } from "vue";
import Icon from "./Icon.vue";

type Tone = "default" | "accent" | "success" | "warn" | "danger" | "info";

interface Props {
  tone?: Tone | undefined;
  icon?: string | null | undefined;
  removable?: boolean | undefined;
  /**
   * Free-form colour (hex or any CSS colour), e.g. a category's or a kind's.
   * On a label it overrides the tone and tints the pill: background = colour
   * @ 18%, border = colour @ 42%, and the text blends the colour toward
   * `--wp-text` so a pale pick stays readable in light mode and a dark pick
   * in dark mode. On a toggle it is the "on" colour. `null` reads as none.
   */
  color?: string | null | undefined;
  /** What to render: a span (default), a button, or a link. A toggle is always a button. */
  as?: string | Component | undefined;
  /** Makes it a toggle (`aria-pressed`). Leave unset for a plain label. */
  pressed?: boolean | undefined;
  /** A small number after the label. */
  count?: number | string | undefined;
  /** A status dot before the label, in the chip's colour. */
  dot?: boolean | undefined;
  size?: "xs" | "sm" | "md" | undefined;
  /** `pill` (default) or `stat`: a tile with the count big on top. */
  variant?: "pill" | "stat" | undefined;
  disabled?: boolean | undefined;
}
const props = withDefaults(defineProps<Props>(), { tone: "default", as: "span", size: "xs", variant: "pill", pressed: undefined });

const emit = defineEmits<{
  (e: "remove"): void;
}>();

const toggle = computed(() => props.pressed !== undefined);
const tag = computed(() => (toggle.value ? "button" : props.as));
const pressable = computed(() => tag.value !== "span");
const stat = computed(() => props.variant === "stat");
const classes = computed(() => [
  "wp-chip",
  `wp-chip--${props.size}`,
  stat.value && "wp-chip--stat",
  pressable.value && "wp-chip--action",
  toggle.value && "wp-chip--toggle",
  toggle.value && props.color && "wp-chip--tinted",
  !toggle.value && !stat.value && (props.color ? "wp-chip--color" : props.tone !== "default" && `wp-chip--${props.tone}`),
]);

const colorStyle = computed(() => {
  if (!props.color) return undefined;
  const c = props.color;
  if (toggle.value || stat.value) return { "--wp-chip-c": c };
  return {
    color: `color-mix(in oklab, ${c} 65%, var(--wp-text))`,
    background: `color-mix(in oklab, ${c} 18%, transparent)`,
    borderColor: `color-mix(in oklab, ${c} 42%, transparent)`,
  };
});

function onRemove(e: MouseEvent) {
  e.stopPropagation();
  emit("remove");
}
</script>

<template>
  <component
    :is="tag"
    :class="classes"
    :style="colorStyle"
    :type="tag === 'button' ? 'button' : undefined"
    :aria-pressed="toggle ? pressed : undefined"
    :disabled="tag === 'button' ? disabled : undefined"
  >
    <span v-if="dot" class="wp-chip__dot" aria-hidden="true" />
    <!-- 10px sub-ICON_SM: the chip font is 10.5px and a 12px icon read
         oversized next to it. Larger chips get a larger icon. -->
    <Icon v-if="icon && !stat" class="wp-chip__icon" :name="icon" :size="size === 'xs' ? 10 : 12" />
    <template v-if="stat">
      <span v-if="count !== undefined" class="wp-chip__stat-n">{{ count }}</span>
      <span class="wp-chip__stat-label"><slot /></span>
    </template>
    <template v-else>
      <slot />
      <span v-if="count !== undefined" class="wp-chip__count">{{ count }}</span>
    </template>
    <button
      v-if="removable && !pressable"
      type="button"
      class="wp-chip__close"
      aria-label="Remove"
      @click="onRemove"
    >
      <!-- Close glyph also drops to 10px so chip-with-X stays balanced
           against the slimmer body. Hit target stays 20×20 via the
           button's min sizing in tokens.css. -->
      <Icon name="times" :size="10" />
    </button>
  </component>
</template>

<style scoped>
/* The base pill, its tones, dot and ✕ live here too, not only in the page
   theme (theme/tokens.css), so a Chip on the ComfyUI canvas, which never
   loads that sheet, is styled the same. Shared tokens only. */
.wp-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 1px 7px;
  border: 1px solid var(--wp-border);
  border-radius: var(--wp-radius-cap, 999px);
  background: var(--wp-bg-3);
  color: var(--wp-text-muted);
  font-family: var(--wp-font-sans);
  font-size: 10.5px;
  font-weight: 500;
  white-space: nowrap;
}
.wp-chip--accent {
  color: var(--wp-accent-text-strong);
  background: color-mix(in oklab, var(--wp-accent-500) 16%, transparent);
  border-color: color-mix(in oklab, var(--wp-accent-500) 38%, transparent);
}
.wp-chip--success { color: var(--wp-success); background: color-mix(in oklab, var(--wp-success) 14%, transparent); border-color: color-mix(in oklab, var(--wp-success) 36%, transparent); }
.wp-chip--warn { color: var(--wp-warn); background: color-mix(in oklab, var(--wp-warn) 14%, transparent); border-color: color-mix(in oklab, var(--wp-warn) 36%, transparent); }
.wp-chip--danger { color: var(--wp-danger); background: color-mix(in oklab, var(--wp-danger) 14%, transparent); border-color: color-mix(in oklab, var(--wp-danger) 36%, transparent); }
.wp-chip--info { color: var(--wp-info); background: color-mix(in oklab, var(--wp-info) 14%, transparent); border-color: color-mix(in oklab, var(--wp-info) 36%, transparent); }
.wp-chip__dot { width: 7px; height: 7px; border-radius: var(--wp-radius-cap, 999px); background: currentColor; }
.wp-chip__close {
  position: relative; display: inline-grid; place-items: center;
  width: 12px; height: 12px; margin: 0 -2px 0 1px; padding: 0;
  border: none; border-radius: 0; background: none;
  color: inherit; opacity: 0.65; cursor: pointer; line-height: 0;
  transition: opacity var(--wp-motion-quick) ease;
}
.wp-chip__close::after { content: ""; position: absolute; inset: -4px; }
.wp-chip__close:hover { opacity: 1; }
.wp-chip__close:focus-visible { outline: 2px solid var(--wp-accent-500); outline-offset: 1px; border-radius: min(2px, var(--wp-radius-cap, 999px)); opacity: 1; }
.wp-chip--color { font-weight: 500; }
/* A bordered pill on the canvas: a radius a hair under half its height, so
   Firefox draws it in one piece at ComfyUI's zooms (0.64, 0.8). */
.wp-chip--xs { border-radius: min(9px, var(--wp-radius-cap, 999px)); }
.wp-chip--sm { border-radius: min(calc(var(--wp-control-h-sm) / 2 - 1px), var(--wp-radius-cap, 999px)); }
.wp-chip--md { border-radius: min(calc(var(--wp-control-h-md) / 2 - 1px), var(--wp-radius-cap, 999px)); }
/* xs is the base `.wp-chip` in theme/tokens.css, held at 20px here: its
   content height was 19.2px, which put every icon half a pixel off. */
.wp-chip--xs { box-sizing: border-box; height: 20px; }
/* xs is the base `.wp-chip` in theme/tokens.css. sm and md sit on the
   control height scale so a filter row lines up with the fields beside it. */
.wp-chip--sm, .wp-chip--md {
  height: var(--wp-control-h-sm);
  padding: 0 var(--wp-space-4);
  gap: var(--wp-space-2);
  font-size: var(--wp-text-sm);
  line-height: 1;
}
.wp-chip--md { height: var(--wp-control-h-md); padding: 0 var(--wp-space-5); font-size: var(--wp-text-base); }

.wp-chip--action {
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: background var(--wp-motion-quick) ease, border-color var(--wp-motion-quick) ease, color var(--wp-motion-quick) ease, filter var(--wp-motion-quick) ease;
}
.wp-chip--action:hover:not(:disabled) { border-color: var(--wp-border-strong); color: var(--wp-text); }
.wp-chip--action.wp-chip--color:hover,
.wp-chip--action.wp-chip--accent:hover { color: inherit; filter: brightness(1.08); }
.wp-chip--action:focus-visible { outline: none; box-shadow: var(--wp-focus-ring); }
.wp-chip--action:disabled { opacity: 0.45; cursor: not-allowed; }

/* A toggle: neutral when off, lit in the accent or its colour when on. */
.wp-chip--toggle { --wp-chip-c: var(--wp-accent-500); }
.wp-chip--tinted .wp-chip__icon { color: var(--wp-chip-c); }
.wp-chip--toggle[aria-pressed="true"] {
  border-color: color-mix(in oklab, var(--wp-chip-c) 45%, transparent);
  background: color-mix(in oklab, var(--wp-chip-c) 16%, transparent);
  color: var(--wp-accent-text-strong);
}
.wp-chip--tinted[aria-pressed="true"] { color: var(--wp-chip-c); }

.wp-chip__count {
  padding: 0 var(--wp-space-2);
  border-radius: var(--wp-radius-cap, 999px);
  background: var(--wp-bg-4, var(--wp-bg-2));
  color: var(--wp-text-dim);
  font-family: var(--wp-font-mono);
  font-size: 0.9em;
  line-height: 1.4;
}
.wp-chip--sm .wp-chip__count, .wp-chip--md .wp-chip__count { padding: 1px var(--wp-space-3); font-size: var(--wp-text-xs); }
.wp-chip--toggle[aria-pressed="true"] .wp-chip__count {
  background: color-mix(in oklab, var(--wp-chip-c) 22%, transparent);
  color: inherit;
}

/* A stat tile: the count big on top, the label under it, a top edge in its
   colour. Pressed, it fills with a little of that colour. */
.wp-chip--stat {
  --wp-chip-c: var(--wp-border-strong);
  box-sizing: border-box;
  height: auto;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--wp-space-1);
  padding: var(--wp-space-4) var(--wp-space-5);
  border: 1px solid var(--wp-border);
  border-top: 3px solid var(--wp-chip-c);
  border-radius: min(8px, var(--wp-radius-cap, 999px));
  background: var(--wp-bg-2);
  color: var(--wp-text);
  font-size: var(--wp-text-xs);
  line-height: 1.3;
  text-align: left;
  white-space: normal;
}
.wp-chip--stat.wp-chip--toggle[aria-pressed="true"] {
  border-color: var(--wp-chip-c);
  background: color-mix(in oklab, var(--wp-chip-c) 12%, var(--wp-bg-2));
  color: var(--wp-text);
}
.wp-chip__stat-n {
  font-size: var(--wp-text-xl);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.wp-chip__stat-label { color: var(--wp-text-muted); }
</style>
