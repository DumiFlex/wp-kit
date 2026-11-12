<script setup lang="ts">
/**
 * WpIconButton: the 20 px square icon button inside a canvas row (module,
 * injector, bundle and model rows, the Context toolbar). Rows are too tight
 * for the 24 px `Button size="sm"`, so this is the one smaller control on
 * the canvas, still at the 20 px hit-target floor.
 *
 *   <WpIconButton icon="pi-trash" label="Remove module" tone="danger" @click="remove" />
 *   <WpIconButton icon="pi-lock" label="Lock seed" tone="warn" :pressed="locked" />
 *   <WpIconButton :open="open" label="Hair colour options" @click="open = !open" />
 *
 * - `tone` tints the icon on hover, and the whole button while `pressed`.
 * - `pressed` makes it a toggle (`aria-pressed`); `"mixed"` is the bundle
 *   master toggle's "some children" state (dashed, half tint).
 * - `open` makes it a fold caret: one chevron that points right when
 *   folded and turns down when open, with `aria-expanded`, drawn bare
 *   (no box, 14 px wide, still 20 px to click). Name what it folds in
 *   `label`; `icon` is ignored. `variant="bare"` alone is the same look
 *   for any other glyph.
 * - `label` names it for screen readers and is its tooltip, unless `hint`
 *   gives a longer one.
 */
import { computed } from "vue";
import { vTooltip } from "./tooltip";

const props = withDefaults(defineProps<{
  /** PrimeIcons class, e.g. `pi-trash`. Leave it out to draw a short
   *  glyph from the slot instead (the loop's Σ toggle). */
  icon?: string | undefined;
  label: string;
  /** A longer tooltip than the label. */
  hint?: string | undefined;
  tone?: "neutral" | "accent" | "warn" | "danger" | undefined;
  pressed?: boolean | "mixed" | undefined;
  variant?: "quiet" | "bare" | undefined;
  disabled?: boolean | undefined;
  /** A fold caret: true when the thing it folds is open. */
  open?: boolean | undefined;
}>(), { icon: undefined, hint: undefined, tone: "neutral", pressed: undefined, variant: undefined, open: undefined });

const emit = defineEmits<{ click: [evt: MouseEvent] }>();

const isCaret = computed(() => props.open !== undefined);
const look = computed(() => props.variant ?? (isCaret.value ? "bare" : "quiet"));
const glyph = computed(() => (isCaret.value ? "pi-chevron-right" : props.icon));
const tip = computed(() => props.hint ?? (isCaret.value ? `${props.open ? "Collapse" : "Expand"} ${props.label}` : props.label));
</script>

<template>
  <button
    v-tooltip="tip"
    type="button"
    class="wp-icon-btn"
    :data-tone="tone"
    :data-variant="look"
    :data-caret="isCaret || undefined"
    :aria-label="label"
    :aria-pressed="pressed"
    :aria-expanded="open"
    :disabled="disabled"
    @click="emit('click', $event)"
  >
    <i v-if="glyph" class="pi" :class="glyph" aria-hidden="true" />
    <span v-else class="wp-icon-btn__glyph" aria-hidden="true"><slot /></span>
  </button>
</template>

<style scoped>
.wp-icon-btn {
  --tone: var(--wp-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex: none;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  margin: 0;
  padding: 0;
  border: 1px solid var(--wp-border-strong);
  border-radius: var(--wp-radius);
  background: var(--wp-bg-2);
  color: var(--wp-text);
  font: 500 11px/1 var(--wp-font-sans);
  cursor: pointer;
  transition: background var(--wp-motion-quick), border-color var(--wp-motion-quick), color var(--wp-motion-quick);
}
/* The drawn box stays 20 px (it lines up with ComfyUI's own icon-sm and our
   rows); the click reaches 24 x 24, ComfyUI's row control size. */
.wp-icon-btn::after { content: ""; position: absolute; inset: -3px; }
.wp-icon-btn[data-tone="accent"] { --tone: var(--wp-accent); }
.wp-icon-btn[data-tone="warn"] { --tone: var(--wp-warn); }
.wp-icon-btn[data-tone="danger"] { --tone: var(--wp-danger); }
/* Even icon in the 18px inside of the box: an odd size sits half a pixel off. */
.wp-icon-btn .pi { font-size: 12px; }
.wp-icon-btn__glyph { font: 600 11px/1 var(--wp-font-mono); }
.wp-icon-btn:hover:not(:disabled) { background: var(--wp-bg-4); color: var(--tone); }
.wp-icon-btn:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--wp-border-focus); }
.wp-icon-btn:disabled { opacity: 0.45; cursor: not-allowed; }
/* On: the tone tints the icon and washes the box, the same tint as hover. */
.wp-icon-btn[aria-pressed="true"] {
  color: var(--tone);
  background: color-mix(in srgb, var(--tone) 14%, transparent);
}
.wp-icon-btn[aria-pressed="mixed"] {
  color: var(--tone);
  background: color-mix(in srgb, var(--tone) 7%, transparent);
  border-style: dashed;
  opacity: 0.75;
}
/* The fold caret: no box, 14 px of layout, 20 px of hit area. */
.wp-icon-btn[data-variant="bare"] {
  width: 20px;
  margin-inline: -3px;
  border-color: transparent;
  background: none;
  color: var(--wp-text-dim);
}
.wp-icon-btn[data-variant="bare"] .pi { font-size: 10px; }
.wp-icon-btn[data-variant="bare"]:hover:not(:disabled) { background: none; color: var(--wp-text); }
/* The fold caret turns instead of swapping glyphs. */
.wp-icon-btn[data-caret] .pi { transition: transform var(--wp-motion-swap) var(--wp-motion-curve-collapse); }
.wp-icon-btn[data-caret][aria-expanded="true"] .pi { transform: rotate(90deg); }
@media (prefers-reduced-motion: reduce) {
  .wp-icon-btn, .wp-icon-btn[data-caret] .pi { transition: none; }
}
</style>
