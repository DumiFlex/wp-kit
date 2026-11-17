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
 * pad, or `x-dots` / `y-dots` put them at given values (`stepDots` from
 * `xy-pad.ts` gives one per step), and `snap-dots` makes the point land on
 * them. `variant`: `pad` (the plain pad), `size` (area, `guides` ratio lines
 * through 0,0 and a "W × H" readout: a picture size) or `stick` (round, zero
 * in the middle, the point kept inside the circle). `x-bands` / `y-bands`
 * label stretches of an axis (words per range) as stripes. `tint` colours
 * each section the bands make (one colour per word, or per pair of words with
 * bands on both axes), the one the point is in a little stronger. The default slot
 * draws over the pad; it gets the pad's percentages as `xPct` / `yPct`.
 * `fine-step` + Shift drags finer, like Slider. `ring` (0..1) draws a ring
 * round the point that grows with it: a third number (a depth, a Z) shown
 * on the pad, set by a Slider beside it.
 *
 * Keyboard: the point is one focus stop (role slider, its value read as
 * "Width 1024, Height 1344"). Left/Right move X, Up/Down move Y by one step
 * (one dot with `snap-dots`), PageUp/PageDown ten Y steps, Shift + an arrow
 * ten steps, Home/End put X at its ends.
 */
import { computed, ref } from "vue";
import { keyStep, percentOf, snap } from "./slider-math";
import { bandSpans, evenDots, guideLine, insideCircle, nearestStop, ratioName, type PadBand } from "./xy-pad";

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
  /** How a value reads (screen readers, the size readout), per axis. */
  format?: ((v: number, axis: "x" | "y") => string) | undefined;
  /** Shade the box from the bottom-left corner to the point. */
  area?: boolean | undefined;
  /** Lines through the point. */
  crosshair?: boolean | undefined;
  /** N × N dots on the pad (0 for none), for an axis without its own dots. */
  grid?: number | undefined;
  /** Dots across at these X values (overrides `grid` for X). */
  xDots?: readonly number[] | undefined;
  /** Dots up at these Y values (overrides `grid` for Y). */
  yDots?: readonly number[] | undefined;
  /** The point lands on the nearest dot (or edge) of each axis. */
  snapDots?: boolean | undefined;
  /** pad, size (area + ratio guides + readout) or stick (round, zero in the middle). */
  variant?: "pad" | "size" | "stick" | undefined;
  /** Height-over-width ratios drawn as lines through 0,0 by the size variant. */
  guides?: readonly number[] | undefined;
  /** Labelled stretches of X (stripes with their word under them). */
  xBands?: readonly PadBand[] | undefined;
  /** Labelled stretches of Y (stripes with their word beside them). */
  yBands?: readonly PadBand[] | undefined;
  /** Colour each section the bands make (needs `x-bands` or `y-bands`). */
  tint?: boolean | undefined;
  /** A ring round the point, 0 (tight) to 1 (wide): a third number shown on the pad (a Z). */
  ring?: number | undefined;
  size?: "sm" | "md" | undefined;
  disabled?: boolean | undefined;
}>(), {
  xMin: 0, xMax: 1, xStep: 0.01, yMin: 0, yMax: 1, yStep: 0.01, ratio: 1,
  xLabel: "X", yLabel: "Y", crosshair: true, grid: 6, size: "md", variant: "pad",
  guides: () => [1, 4 / 3, 3 / 4, 16 / 9, 9 / 16],
});

const emit = defineEmits<{ (e: "update:modelValue", v: [number, number]): void; (e: "change", v: [number, number]): void }>();
defineSlots<{ default?: (p: { xPct: number; yPct: number }) => unknown }>();

const padEl = ref<HTMLElement | null>(null);
const dragging = ref(false);

const stick = computed(() => props.variant === "stick");
const sized = computed(() => props.variant === "size");
const xStops = computed(() => props.xDots ? [...props.xDots] : evenDots(props.xMin, props.xMax, props.grid));
const yStops = computed(() => props.yDots ? [...props.yDots] : evenDots(props.yMin, props.yMax, props.grid));

const x = computed(() => snap(props.modelValue[0], props.xMin, props.xMax, props.fineStep ?? props.xStep));
const y = computed(() => snap(props.modelValue[1], props.yMin, props.yMax, props.fineStep ?? props.yStep));
const xPct = computed(() => percentOf(x.value, props.xMin, props.xMax));
const yPct = computed(() => percentOf(y.value, props.yMin, props.yMax));

const say = (v: number, axis: "x" | "y"): string => (props.format ? props.format(v, axis) : String(v));
const valueText = computed(() => `${props.xLabel} ${say(x.value, "x")}, ${props.yLabel} ${say(y.value, "y")}`);
const readout = computed(() => `${say(x.value, "x")} × ${say(y.value, "y")}`);
const dots = computed(() => {
  const xs = xStops.value.map((v) => percentOf(v, props.xMin, props.xMax));
  const ys = yStops.value.map((v) => percentOf(v, props.yMin, props.yMax));
  const out: { l: number; b: number }[] = [];
  for (const l of xs) for (const b of ys) {
    if (stick.value && Math.hypot(l - 50, b - 50) > 50) continue;
    out.push({ l, b });
  }
  return out;
});
/** How many colours the sections take turns with (`data-tone` 0..5). */
const CELL_TONES = 6;
const xBandSpans = computed(() => (props.xBands?.length ? bandSpans(props.xBands, props.xMin, props.xMax) : []));
const yBandSpans = computed(() => (props.yBands?.length ? bandSpans(props.yBands, props.yMin, props.yMax) : []));
const guideLines = computed(() => {
  if (!sized.value) return [];
  return props.guides.flatMap((r) => {
    const g = guideLine(r, props.xMin, props.xMax, props.yMin, props.yMax);
    return g ? [{ r, name: ratioName(1 / r), x1: g[0], y1: 100 - g[1], x2: g[2], y2: 100 - g[3] }] : [];
  });
});
/** The sections the bands cut the pad into, top row first, each with a colour. */
const cells = computed(() => {
  if (!props.tint || (!xBandSpans.value.length && !yBandSpans.value.length)) return [];
  const xs = xBandSpans.value.length ? xBandSpans.value : [{ from: 0, to: 100, label: "" }];
  const ys = (yBandSpans.value.length ? yBandSpans.value : [{ from: 0, to: 100, label: "" }]).slice().reverse();
  const out: { key: string; left: number; width: number; bottom: number; height: number; tone: number; on: boolean }[] = [];
  ys.forEach((yb, r) => xs.forEach((xb, c) => {
    out.push({
      key: `${r}-${c}`, left: xb.from, width: xb.to - xb.from, bottom: yb.from, height: yb.to - yb.from,
      tone: (r * xs.length + c + (xs.length % CELL_TONES === 0 ? r : 0)) % CELL_TONES,
      on: inBand(xb, xPct.value) && inBand(yb, yPct.value),
    });
  }));
  return out;
});
const inBand = (s: { from: number; to: number }, pct: number): boolean => pct >= s.from && (pct < s.to || s.to === 100);

function set(nx: number, ny: number): [number, number] {
  const next: [number, number] = [nx, ny];
  if (!props.disabled && (nx !== props.modelValue[0] || ny !== props.modelValue[1])) emit("update:modelValue", next);
  return next;
}

/** One axis's value at `t` (0..1) of the pad: on its step, then its dots when asked. */
function axisAt(t: number, min: number, max: number, step: number, stops: readonly number[]): number {
  const v = snap(min + t * (max - min), min, max, step);
  return props.snapDots ? nearestStop(v, stops, min, max) : v;
}

function fromPointer(ev: PointerEvent): [number, number] {
  const r = padEl.value?.getBoundingClientRect();
  if (!r) return [x.value, y.value];
  const fine = ev.shiftKey && props.fineStep;
  const xs = fine ? (props.fineStep ?? props.xStep) : props.xStep;
  const ys = fine ? (props.fineStep ?? props.yStep) : props.yStep;
  const clamp = (t: number): number => Math.min(1, Math.max(0, t));
  let tx = clamp(r.width > 0 ? (ev.clientX - r.left) / r.width : 0);
  let ty = clamp(r.height > 0 ? (r.bottom - ev.clientY) / r.height : 0);
  if (stick.value) {
    const [cx, cy] = insideCircle(tx * 100, ty * 100);
    tx = cx / 100;
    ty = cy / 100;
  }
  return [axisAt(tx, props.xMin, props.xMax, xs, xStops.value), axisAt(ty, props.yMin, props.yMax, ys, yStops.value)];
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

/** The next dot (or edge) from `v` toward `dir`, `times` dots on. */
function nextStop(v: number, stops: readonly number[], min: number, max: number, dir: 1 | -1, times: number): number {
  const all = [min, ...stops, max].sort((a, b) => a - b);
  let cur = v;
  for (let i = 0; i < times; i++) {
    const n = dir > 0 ? all.find((s) => s > cur + 1e-9) : [...all].reverse().find((s) => s < cur - 1e-9);
    if (n === undefined) break;
    cur = n;
  }
  return cur;
}

function axisKey(key: string, v: number, min: number, max: number, step: number, stops: readonly number[], big: number): number | null {
  if (!props.snapDots) return keyStep(key, v, min, max, step * big);
  switch (key) {
    case "ArrowRight": case "ArrowUp": return nextStop(v, stops, min, max, 1, big);
    case "ArrowLeft": case "ArrowDown": return nextStop(v, stops, min, max, -1, big);
    case "PageUp": return nextStop(v, stops, min, max, 1, 10);
    case "PageDown": return nextStop(v, stops, min, max, -1, 10);
    case "Home": return min;
    case "End": return max;
    default: return null;
  }
}

function onKeydown(ev: KeyboardEvent): void {
  if (props.disabled) return;
  const big = ev.shiftKey ? 10 : 1;
  let next: [number, number] | null = null;
  switch (ev.key) {
    case "ArrowLeft": case "ArrowRight": case "Home": case "End": {
      const v = axisKey(ev.key, x.value, props.xMin, props.xMax, props.xStep, xStops.value, big);
      if (v !== null) next = [v, y.value];
      break;
    }
    case "ArrowUp": case "ArrowDown": case "PageUp": case "PageDown": {
      const v = axisKey(ev.key, y.value, props.yMin, props.yMax, props.yStep, yStops.value, big);
      if (v !== null) next = [x.value, v];
      break;
    }
    default: return;
  }
  if (!next) return;
  ev.preventDefault();
  const nx = props.snapDots ? next[0] : snap(next[0], props.xMin, props.xMax, props.xStep);
  const ny = props.snapDots ? next[1] : snap(next[1], props.yMin, props.yMax, props.yStep);
  emit("change", set(nx, ny));
}
</script>

<template>
  <div
    ref="padEl"
    class="wp-xypad"
    :data-size="size"
    :data-variant="variant"
    :data-disabled="disabled || undefined"
    :data-dragging="dragging || undefined"
    :style="{ aspectRatio: String(stick ? 1 : ratio) }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div v-if="cells.length" class="wp-xypad__cells" aria-hidden="true">
      <span
        v-for="c in cells" :key="c.key" class="wp-xypad__cell" :data-tone="c.tone" :data-on="c.on || undefined"
        :style="{ left: `${c.left}%`, width: `${c.width}%`, bottom: `${c.bottom}%`, height: `${c.height}%` }"
      />
    </div>
    <div v-if="xBandSpans.length || yBandSpans.length" class="wp-xypad__bands" aria-hidden="true">
      <span
        v-for="(b, i) in xBandSpans" :key="`x${i}`" class="wp-xypad__band wp-xypad__band--x"
        :data-odd="i % 2 === 1 || undefined" :data-on="inBand(b, xPct) || undefined"
        :style="{ left: `${b.from}%`, width: `${b.to - b.from}%` }"
      ><span class="wp-xypad__band-label">{{ b.label }}</span></span>
      <span
        v-for="(b, i) in yBandSpans" :key="`y${i}`" class="wp-xypad__band wp-xypad__band--y"
        :data-odd="i % 2 === 1 || undefined" :data-on="inBand(b, yPct) || undefined"
        :style="{ bottom: `${b.from}%`, height: `${b.to - b.from}%` }"
      ><span class="wp-xypad__band-label">{{ b.label }}</span></span>
    </div>
    <span v-for="(d, i) in dots" :key="i" class="wp-xypad__dot" :style="{ left: `${d.l}%`, bottom: `${d.b}%` }" aria-hidden="true" />
    <span v-if="area || sized" class="wp-xypad__area" :style="{ width: `${xPct}%`, height: `${yPct}%` }" aria-hidden="true" />
    <svg v-if="guideLines.length || stick" class="wp-xypad__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <line
        v-for="g in guideLines" :key="g.r" class="wp-xypad__guide"
        :x1="g.x1" :y1="g.y1" :x2="g.x2" :y2="g.y2" vector-effect="non-scaling-stroke"
      />
      <template v-if="stick">
        <line class="wp-xypad__axis" x1="50" y1="0" x2="50" y2="100" vector-effect="non-scaling-stroke" />
        <line class="wp-xypad__axis" x1="0" y1="50" x2="100" y2="50" vector-effect="non-scaling-stroke" />
        <line class="wp-xypad__stem" x1="50" y1="50" :x2="xPct" :y2="100 - yPct" vector-effect="non-scaling-stroke" />
      </template>
    </svg>
    <span
      v-for="g in guideLines" :key="`n${g.r}`" class="wp-xypad__guide-name"
      :style="{ left: `${g.x2}%`, top: `${g.y2}%` }" aria-hidden="true"
    >{{ g.name }}</span>
    <div class="wp-xypad__over" aria-hidden="true"><slot :x-pct="xPct" :y-pct="yPct" /></div>
    <template v-if="crosshair">
      <span class="wp-xypad__line wp-xypad__line--v" :style="{ left: `${xPct}%` }" aria-hidden="true" />
      <span class="wp-xypad__line wp-xypad__line--h" :style="{ bottom: `${yPct}%` }" aria-hidden="true" />
    </template>
    <span v-if="sized" class="wp-xypad__readout" aria-hidden="true">{{ readout }}</span>
    <span
      v-if="ring !== undefined" class="wp-xypad__ring" aria-hidden="true"
      :style="{ left: `${xPct}%`, bottom: `${yPct}%`, '--_ring': String(Math.min(1, Math.max(0, ring))) }"
    />
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
  --_halo: 6px;
  position: relative; width: 100%; box-sizing: border-box; overflow: hidden;
  background: var(--wp-bg-1); box-shadow: inset 0 0 0 1px var(--wp-border);
  border-radius: min(8px, var(--wp-radius-cap, 999px));
  cursor: crosshair; touch-action: none; user-select: none;
}
.wp-xypad[data-size="sm"] { --_thumb: 14px; --_halo: 4px; }
.wp-xypad__dot {
  position: absolute; width: 3px; height: 3px; margin: 0 0 -1.5px -1.5px;
  border-radius: min(50%, var(--wp-radius-cap, 999px)); background: var(--wp-border-strong); pointer-events: none;
}
.wp-xypad__area {
  position: absolute; left: 0; bottom: 0; pointer-events: none;
  background: color-mix(in srgb, var(--wp-accent) 16%, transparent);
  box-shadow: inset 0 0 0 1.5px var(--wp-accent);
}
.wp-xypad[data-variant="stick"] { border-radius: min(50%, var(--wp-radius-cap, 999px)); }
.wp-xypad__svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.wp-xypad__guide { stroke: var(--wp-text-muted); stroke-opacity: 0.45; stroke-width: 1; stroke-dasharray: 2 3; }
.wp-xypad__guide-name {
  position: absolute; transform: translate(-100%, 0); padding: 1px 3px; pointer-events: none;
  font-size: 9px; line-height: 11px; color: var(--wp-text-muted); white-space: nowrap;
}
.wp-xypad__axis { stroke: var(--wp-border-strong); stroke-width: 1; }
.wp-xypad__stem { stroke: var(--wp-accent); stroke-width: 2; stroke-linecap: round; }
.wp-xypad__readout {
  position: absolute; bottom: 4px; right: 4px; padding: 1px 5px; pointer-events: none;
  border-radius: min(4px, var(--wp-radius-cap, 999px)); background: color-mix(in srgb, var(--wp-bg) 85%, transparent);
  font-size: 11px; line-height: 14px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--wp-text);
}
.wp-xypad__cells { position: absolute; inset: 0; pointer-events: none; }
.wp-xypad__cell { position: absolute; --_tone: var(--wp-amber); background: color-mix(in srgb, var(--_tone) 9%, transparent); transition: background var(--wp-motion-quick); }
.wp-xypad__cell[data-tone="1"] { --_tone: var(--wp-rose); }
.wp-xypad__cell[data-tone="2"] { --_tone: var(--wp-teal); }
.wp-xypad__cell[data-tone="3"] { --_tone: var(--wp-violet); }
.wp-xypad__cell[data-tone="4"] { --_tone: var(--wp-green); }
.wp-xypad__cell[data-tone="5"] { --_tone: var(--wp-red); }
.wp-xypad__cell[data-on] { background: color-mix(in srgb, var(--_tone) 18%, transparent); }
.wp-xypad__bands { position: absolute; inset: 0; pointer-events: none; }
.wp-xypad__band { position: absolute; box-sizing: border-box; }
.wp-xypad__band--x { top: 0; bottom: 0; }
.wp-xypad__band--y { left: 0; right: 0; }
.wp-xypad__band[data-odd] { background: color-mix(in srgb, var(--wp-text) 4%, transparent); }
.wp-xypad__band--x + .wp-xypad__band--x { border-left: 1px dashed var(--wp-border); }
.wp-xypad__band--y + .wp-xypad__band--y { border-bottom: 1px dashed var(--wp-border); }
.wp-xypad__band-label {
  position: absolute; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 10px; line-height: 12px; color: var(--wp-text-muted);
}
.wp-xypad__band--x .wp-xypad__band-label { bottom: 3px; left: 50%; transform: translateX(-50%); }
.wp-xypad__band--y .wp-xypad__band-label { left: 4px; top: 50%; transform: translateY(-50%); }
.wp-xypad__band[data-on] .wp-xypad__band-label { color: var(--wp-accent); font-weight: 600; }
.wp-xypad__over { position: absolute; inset: 0; pointer-events: none; }
.wp-xypad__line { position: absolute; pointer-events: none; background: color-mix(in srgb, var(--wp-accent) 35%, transparent); }
.wp-xypad__line--v { top: 0; bottom: 0; width: 1px; margin-left: -0.5px; }
.wp-xypad__line--h { left: 0; right: 0; height: 1px; margin-bottom: -0.5px; }
.wp-xypad__ring {
  --_d: calc(var(--_thumb) + 6px + var(--_ring) * 4 * var(--_thumb));
  position: absolute; box-sizing: border-box; width: var(--_d); height: var(--_d);
  margin: 0 0 calc(var(--_d) / -2) calc(var(--_d) / -2); pointer-events: none;
  border: 1.5px solid color-mix(in srgb, var(--wp-accent) 60%, transparent);
  border-radius: min(50%, var(--wp-radius-cap, 999px));
  background: color-mix(in srgb, var(--wp-accent) 6%, transparent);
}
.wp-xypad__thumb {
  position: absolute; box-sizing: border-box; width: var(--_thumb); height: var(--_thumb);
  margin: 0 0 calc(var(--_thumb) / -2) calc(var(--_thumb) / -2);
  border: 3px solid var(--wp-accent); border-radius: min(50%, var(--wp-radius-cap, 999px));
  background: var(--wp-bg); outline: none;
  box-shadow: 0 0 0 var(--_halo) color-mix(in srgb, var(--wp-accent) 20%, transparent), var(--wp-shadow-sm);
  transition: transform var(--wp-motion-quick), box-shadow var(--wp-motion-quick);
}
.wp-xypad:hover .wp-xypad__thumb, .wp-xypad[data-dragging] .wp-xypad__thumb { transform: scale(1.1); }
.wp-xypad__thumb:focus-visible { box-shadow: var(--wp-focus-ring), 0 0 0 var(--_halo) color-mix(in srgb, var(--wp-accent) 20%, transparent); }
.wp-xypad[data-disabled] { opacity: 0.45; cursor: not-allowed; }
.wp-xypad[data-disabled] .wp-xypad__thumb { transform: none; }
@media (prefers-reduced-motion: reduce) {
  .wp-xypad__thumb { transition: none; }
}
</style>
