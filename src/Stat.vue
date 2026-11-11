<script setup lang="ts">
/**
 * Stat: one number with its name. A dashboard count, a moderation total,
 * a post's stars and downloads, a database's size.
 *
 *   <Stat label="Wildcards" :value="128" icon="pi-sparkles" delta="edited 2h ago" />
 *   <Stat variant="row" label="Downloads" :value="1204" />
 *
 * `tile` (the default) is a small card: label on top, the value large, an
 * optional icon in the corner and a `delta` line (or `#delta` slot) under
 * it; `size="sm"` is the compact tile for a drawer or a narrow column.
 * `row` is a label/value line for a summary list; rows stack with a rule
 * between them. Numbers get tabular figures and the locale's grouping.
 * `as="button"` / `as="a"` (plus `href`) makes a tile a link or an action,
 * with a hover lift. `loading` draws a Skeleton in place of the value.
 *
 * Shared tokens only, so it wears whichever side it sits on.
 */
import { computed } from "vue";
import Skeleton from "./Skeleton.vue";

const props = withDefaults(defineProps<{
  label: string;
  /** A number (grouped for the locale) or text ("v12", "3 days ago"). */
  value?: number | string | null | undefined;
  /** A PrimeIcons class, e.g. "pi-star". */
  icon?: string | undefined;
  /** A short line under the value (tiles only). */
  delta?: string | undefined;
  /** The icon's colour. */
  tone?: "accent" | "neutral" | "success" | "warn" | "danger" | "info" | undefined;
  variant?: "tile" | "row" | undefined;
  size?: "sm" | "md" | undefined;
  as?: "div" | "button" | "a" | undefined;
  loading?: boolean | undefined;
  /** BCP 47 locale for number grouping (defaults to the browser's). */
  locale?: string | undefined;
}>(), {
  value: null, icon: undefined, delta: undefined, tone: "accent", variant: "tile", size: "md",
  as: "div", loading: false, locale: undefined,
});

const shown = computed(() => {
  const v = props.value;
  if (v === null || v === undefined || v === "") return "—";
  return typeof v === "number" ? v.toLocaleString(props.locale) : v;
});
</script>

<template>
  <component
    :is="as"
    class="wp-stat-piece"
    :class="[`wp-stat-piece--${variant}`, `wp-stat-piece--${size}`]"
    :data-tone="tone"
    :type="as === 'button' ? 'button' : undefined"
    data-test="stat"
  >
    <span class="wp-stat-piece__label">
      <i v-if="icon && variant === 'row'" class="pi wp-stat-piece__row-icon" :class="icon" aria-hidden="true" />
      {{ label }}
    </span>
    <span class="wp-stat-piece__value" data-test="stat-value">
      <Skeleton v-if="loading" width="3ch" :label="`Loading ${label}`" />
      <slot v-else name="value">{{ shown }}</slot>
    </span>
    <span v-if="variant === 'tile' && (delta || $slots.delta)" class="wp-stat-piece__delta">
      <slot name="delta">{{ delta }}</slot>
    </span>
    <span v-if="icon && variant === 'tile'" class="wp-stat-piece__icon" aria-hidden="true"><i class="pi" :class="icon" /></span>
  </component>
</template>

<style scoped>
.wp-stat-piece {
  --_tone: var(--wp-accent-500);
  position: relative;
  box-sizing: border-box;
  min-width: 0;
  margin: 0;
  color: var(--wp-text);
  font-family: var(--wp-font-sans);
  text-align: left;
  text-decoration: none;
}
.wp-stat-piece[data-tone="neutral"] { --_tone: var(--wp-text-dim); }
.wp-stat-piece[data-tone="success"] { --_tone: var(--wp-success); }
.wp-stat-piece[data-tone="warn"] { --_tone: var(--wp-warn); }
.wp-stat-piece[data-tone="danger"] { --_tone: var(--wp-danger); }
.wp-stat-piece[data-tone="info"] { --_tone: var(--wp-info); }

/* Tile */
.wp-stat-piece--tile {
  display: flex;
  flex-direction: column;
  gap: var(--wp-space-2);
  padding: 12px 14px;
  background: var(--wp-bg-1);
  border: 1px solid var(--wp-border);
  border-radius: var(--wp-radius-lg);
  overflow: hidden;
  font: inherit;
  transition: transform var(--wp-motion-hover, 0.18s) ease, border-color var(--wp-motion-hover, 0.18s) ease, box-shadow var(--wp-motion-hover, 0.18s) ease;
}
.wp-stat-piece--tile.wp-stat-piece--sm { gap: 2px; padding: 8px 10px; border-radius: var(--wp-radius-md); }
button.wp-stat-piece--tile { cursor: pointer; }
:is(button, a).wp-stat-piece--tile:hover {
  transform: translateY(-2px);
  border-color: var(--wp-border-strong);
  box-shadow: var(--wp-shadow);
}
:is(button, a).wp-stat-piece:focus-visible { outline: 2px solid var(--wp-focus-ring, var(--wp-accent)); outline-offset: 2px; }
.wp-stat-piece--tile .wp-stat-piece__label {
  padding-right: 32px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--wp-text-dim);
}
.wp-stat-piece--tile.wp-stat-piece--sm .wp-stat-piece__label {
  order: 2;
  padding-right: 0;
  font-size: var(--wp-text-xs);
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
  color: var(--wp-text-muted);
}
.wp-stat-piece--tile .wp-stat-piece__value {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.wp-stat-piece--tile.wp-stat-piece--sm .wp-stat-piece__value { order: 1; font-size: 18px; }
.wp-stat-piece__delta {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  font-size: 11px;
  color: var(--wp-text-dim);
}
.wp-stat-piece--sm .wp-stat-piece__delta { order: 3; }
.wp-stat-piece__icon {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: min(7px, var(--wp-radius-cap, 999px));
  background: color-mix(in srgb, var(--_tone) 14%, transparent);
  color: var(--_tone);
  font-size: 13px;
}
.wp-stat-piece[data-tone="accent"] .wp-stat-piece__icon { color: var(--wp-accent-text); }
.wp-stat-piece--sm .wp-stat-piece__icon { top: 8px; right: 8px; width: 22px; height: 22px; font-size: 11px; }

/* Row: a summary line; rows in a column get a rule between them. */
.wp-stat-piece--row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  gap: var(--wp-space-4);
  padding: 12px 0;
  border-bottom: 1px solid var(--wp-border);
}
.wp-stat-piece--row.wp-stat-piece--sm { padding: 8px 0; }
.wp-stat-piece--row:first-child { padding-top: 0; }
.wp-stat-piece--row:last-child { padding-bottom: 0; border-bottom: none; }
.wp-stat-piece--row .wp-stat-piece__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--wp-text-muted);
}
.wp-stat-piece__row-icon { color: var(--_tone); font-size: 12px; }
.wp-stat-piece[data-tone="accent"] .wp-stat-piece__row-icon { color: var(--wp-accent-text); }
.wp-stat-piece--row .wp-stat-piece__value {
  font-family: var(--wp-font-mono);
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.wp-stat-piece--row.wp-stat-piece--sm .wp-stat-piece__value { font-size: 13px; }

@media (prefers-reduced-motion: reduce) {
  .wp-stat-piece--tile { transition: none; }
  :is(button, a).wp-stat-piece--tile:hover { transform: none; }
}
</style>
