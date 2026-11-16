<script setup lang="ts">
/**
 * XYPad: two numbers picked at once by dragging a point over a square (or a
 * `ratio`-shaped) pad: a width and a height, a mood from calm to wild and
 * dark to bright. X grows to the right, Y grows upward.
 *
 *   <XYPad v-model="size" :x-min="512" :x-max="2048" :x-step="64" :y-min="512" :y-max="2048" :y-step="64" aria-label="Size" x-label="Width" y-label="Height" />
 *
 * `area` shades the box from the bottom-left corner to the point (a picture
 * size), `crosshair` draws lines through it, `grid` puts N × N dots on the
 * pad. The default slot draws over the pad (an SVG with guides, ratio lines,
 * words at the edges); it gets the pad's percentages as `xPct` / `yPct`.
 * `fine-step` + Shift drags finer, like Slider.
 *
 * Keyboard: the point is one focus stop (role slider, its value read as
 * "Width 1024, Height 1344"). Left/Right move X, Up/Down move Y by one step,
 * PageUp/PageDown ten Y steps, Shift + an arrow ten steps, Home/End put X at
 * its ends.
 */
import { computed, ref } from "vue";
import { keyStep, percentOf, snap, valueAt } from "./slider-math";

const props = withDefaults(defineProps<{
  modelValue: [number, number];
  xMin?: number | undefined;
  xMax?: number | undefined;
  xStep?: number | undefined;
  yMin?: number | undefined;
  yMax?: number | undefined;
  yStep?: number | undefined;
  /** A finer step for both axes while Shift is held during a drag. */
  fineStep?: number | undefined;
  /** Width over height of the pad (1 = square). */
  ratio?: number | undefined;
  ariaLabel?: string | undefined;
  xLabel?: string | undefined;
  yLabel?: string | undefined;
  /** How a value reads (screen readers), per axis. */
  format?: ((v: number, axis: "x" | "y") => string) | undefined;
  /** Shade the box from the bottom-left corner to the point. */
  area?: boolean | undefined;
  /** Lines through the point. */
  crosshair?: boolean | undefined;
  /** N × N dots on the pad (0 for none). */
  grid?: number | undefined;
  size?: "sm" | "md" | undefined;
  disabled?: boolean | undefined;
}>(), {
  xMin: 0, xMax: 1, xStep: 0.01, yMin: 0, yMax: 1, yStep: 0.01, ratio: 1,
  xLabel: "X", yLabel: "Y", crosshair: true, grid: 6, size: "md",
});

const emit = defineEmits<{ (e: "update:modelValue", v: [number, number]): void; (e: "change", v: [number, number]): void }>();
defineSlots<{ default?: (p: { xPct: number; yPct: number }) => unknown }>();

const padEl = ref<HTMLElement | null>(null);
const dragging = ref(false);

const x = computed(() => snap(props.modelValue[0], props.xMin, props.xMax, props.fineStep ?? props.xStep));
const y = computed(() => snap(props.modelValue[1], props.yMin, props.yMax, props.fineStep ?? props.yStep));
const xPct = computed(() => percentOf(x.value, props.xMin, props.xMax));
const yPct = computed(() => percentOf(y.value, props.yMin, props.yMax));

const say = (v: number, axis: "x" | "y"): string => (props.format ? props.format(v, axis) : String(v));
const valueText = computed(() => `${props.xLabel} ${say(x.value, "x")}, ${props.yLabel} ${say(y.value, "y")}`);
const dots = computed(() => {
  const n = Math.max(0, Math.floor(props.grid));
  const out: { l: number; b: number }[] = [];
  for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) out.push({ l: (i / (n + 1)) * 100, b: (j / (n + 1)) * 100 });
  return out;
});

function set(nx: number, ny: number): [number, number] {
  const next: [number, number] = [nx, ny];
  if (!props.disabled && (nx !== props.modelValue[0] || ny !== props.modelValue[1])) emit("update:modelValue", next);
  return next;
}

function fromPointer(ev: PointerEvent): [number, number] {
  const r = padEl.value?.getBoundingClientRect();
  if (!r) return [x.value, y.value];
  const fine = ev.shiftKey && props.fineStep;
  const xs = fine ? (props.fineStep ?? props.xStep) : props.xStep;
  const ys = fine ? (props.fineStep ?? props.yStep) : props.yStep;
  return [
    valueAt(ev.clientX, r.left, r.width, props.xMin, props.xMax, xs),
    valueAt(-ev.clientY, -r.bottom, r.height, props.yMin, props.yMax, ys),
  ];
}

function onPointerDown(ev: PointerEvent): void {
  if (props.disabled || ev.button !== 0) return;
  ev.preventDefault();
  dragging.value = true;
  (ev.currentTarget as HTMLElement).setPointerCapture?.(ev.pointerId);
  set(...fromPointer(ev));
  padEl.value?.querySelector<HTMLElement>("[role=slider]")?.focus();
}

function onPointerMove(ev: PointerEvent): void {
  if (dragging.value) set(...fromPointer(ev));
}

function onPointerUp(ev: PointerEvent): void {
  if (!dragging.value) return;
  dragging.value = false;
  (ev.currentTarget as HTMLElement).releasePointerCapture?.(ev.pointerId);
  emit("change", [x.value, y.value]);
}

function onKeydown(ev: KeyboardEvent): void {
  if (props.disabled) return;
  const big = ev.shiftKey ? 10 : 1;
  const xStepBy = (k: string): number | null => keyStep(k, x.value, props.xMin, props.xMax, props.xStep * big);
  const yStepBy = (k: string): number | null => keyStep(k, y.value, props.yMin, props.yMax, props.yStep * big);
  let next: [number, number] | null = null;
  switch (ev.key) {
    case "ArrowLeft": case "ArrowRight": case "Home": case "End": {
      const v = xStepBy(ev.key);
      if (v !== null) next = [v, y.value];
      break;
    }
    case "ArrowUp": case "ArrowDown": case "PageUp": case "PageDown": {
      const v = yStepBy(ev.key);
      if (v !== null) next = [x.value, v];
      break;
    }
    default: return;
  }
  if (!next) return;
  ev.preventDefault();
  emit("change", set(snap(next[0], props.xMin, props.xMax, props.xStep), snap(next[1], props.yMin, props.yMax, props.yStep)));
}
</script>

<template>
  <div
    ref="padEl"
    class="wp-xypad"
    :data-size="size"
    :data-disabled="disabled || undefined"
    :data-dragging="dragging || undefined"
    :style="{ aspectRatio: String(ratio) }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <span v-for="(d, i) in dots" :key="i" class="wp-xypad__dot" :style="{ left: `${d.l}%`, bottom: `${d.b}%` }" aria-hidden="true" />
    <span v-if="area" class="wp-xypad__area" :style="{ width: `${xPct}%`, height: `${yPct}%` }" aria-hidden="true" />
    <div class="wp-xypad__over" aria-hidden="true"><slot :x-pct="xPct" :y-pct="yPct" /></div>
    <template v-if="crosshair">
      <span class="wp-xypad__line wp-xypad__line--v" :style="{ left: `${xPct}%` }" aria-hidden="true" />
      <span class="wp-xypad__line wp-xypad__line--h" :style="{ bottom: `${yPct}%` }" aria-hidden="true" />
    </template>
    <!-- Focusable unless disabled (tabindex is bound). -->
    <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
    <div
      class="wp-xypad__thumb"
      role="slider"
      :tabindex="disabled ? -1 : 0"
      :aria-label="ariaLabel"
      :aria-valuemin="xMin"
      :aria-valuemax="xMax"
      :aria-valuenow="x"
      :aria-valuetext="valueText"
      :aria-disabled="disabled || undefined"
      :style="{ left: `${xPct}%`, bottom: `${yPct}%` }"
      @keydown="onKeydown"
    />
  </div>
</template>

<style scoped>
.wp-xypad {
  --_thumb: 18px;
  position: relative; width: 100%; box-sizing: border-box; overflow: hidden;
  background: var(--wp-bg-1); box-shadow: inset 0 0 0 1px var(--wp-border);
  border-radius: min(8px, var(--wp-radius-cap, 999px));
  cursor: crosshair; touch-action: none; user-select: none;
}
.wp-xypad[data-size="sm"] { --_thumb: 14px; }
.wp-xypad__dot {
  position: absolute; width: 3px; height: 3px; margin: 0 0 -1.5px -1.5px;
  border-radius: min(50%, var(--wp-radius-cap, 999px)); background: var(--wp-border-strong); pointer-events: none;
}
.wp-xypad__area {
  position: absolute; left: 0; bottom: 0; pointer-events: none;
  background: color-mix(in srgb, var(--wp-accent) 16%, transparent);
  box-shadow: inset 0 0 0 1.5px var(--wp-accent);
}
.wp-xypad__over { position: absolute; inset: 0; pointer-events: none; }
.wp-xypad__line { position: absolute; pointer-events: none; background: color-mix(in srgb, var(--wp-accent) 35%, transparent); }
.wp-xypad__line--v { top: 0; bottom: 0; width: 1px; margin-left: -0.5px; }
.wp-xypad__line--h { left: 0; right: 0; height: 1px; margin-bottom: -0.5px; }
.wp-xypad__thumb {
  position: absolute; box-sizing: border-box; width: var(--_thumb); height: var(--_thumb);
  margin: 0 0 calc(var(--_thumb) / -2) calc(var(--_thumb) / -2);
  border: 3px solid var(--wp-accent); border-radius: min(50%, var(--wp-radius-cap, 999px));
  background: var(--wp-bg); box-shadow: var(--wp-shadow-sm); outline: none;
  transition: transform var(--wp-motion-quick), box-shadow var(--wp-motion-quick);
}
.wp-xypad:hover .wp-xypad__thumb, .wp-xypad[data-dragging] .wp-xypad__thumb { transform: scale(1.1); }
.wp-xypad__thumb:focus-visible { box-shadow: var(--wp-focus-ring); }
.wp-xypad[data-disabled] { opacity: 0.45; cursor: not-allowed; }
.wp-xypad[data-disabled] .wp-xypad__thumb { transform: none; }
@media (prefers-reduced-motion: reduce) {
  .wp-xypad__thumb { transition: none; }
}
</style>
