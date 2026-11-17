<script setup lang="ts">
/**
 * OrbitPad: where something sits around a subject, as three numbers set by
 * dragging: an angle around it, a height angle and a distance. Made for a
 * camera (front-left view, high angle, medium shot) or a light (from the
 * left, overhead, close and hard), the words coming from the app.
 *
 *   <OrbitPad v-model="view" aria-label="Camera" />
 *   <OrbitPad v-model="light" variant="light" :distance-max="10" aria-label="Key light" />
 *
 * `v-model` is `[around, height, distance]`. Around is in degrees, 0 the
 * front, 90 the right, ±180 the back (folded into -180..180). Height is in
 * degrees from `height-min` to `height-max` (0 = eye level, 90 = straight
 * above). Two panes: **Around** looks down on the subject (drag the point
 * round it; how far from the middle sets the distance), **Height** looks at
 * it from the side (drag the point up or down the arc). `around-marks` /
 * `height-marks` put words at angles, `format` says a value in words
 * (screen readers, the line under each pane).
 *
 * Keyboard: each point is a focus stop (role slider). Around: Left/Right
 * turn by `around-step` (Shift: ten), Up/Down move it out or in by
 * `distance-step`, Home goes to the front and End to the back. Height:
 * the arrows move by `height-step`, PageUp/PageDown ten, Home/End the ends.
 */
import { computed, ref } from "vue";
import { snap } from "./slider-math";
import {
  aroundOf, aroundPoint, distOf, heightArc, heightOf, heightPoint, radiusOf, SIDE_CENTRE, SIDE_RADIUS, snapAngle, wrapAngle,
} from "./orbit";

export interface OrbitMark { at: number; label: string }

const props = withDefaults(defineProps<{
  modelValue: [number, number, number];
  aroundStep?: number | undefined;
  heightMin?: number | undefined;
  heightMax?: number | undefined;
  heightStep?: number | undefined;
  distanceMin?: number | undefined;
  distanceMax?: number | undefined;
  distanceStep?: number | undefined;
  /** Words at angles around the top view. */
  aroundMarks?: readonly OrbitMark[] | undefined;
  /** Words at heights on the side view's arc. */
  heightMarks?: readonly OrbitMark[] | undefined;
  /** camera (the default) or light: an amber sun for the point. */
  variant?: "camera" | "light" | undefined;
  ariaLabel?: string | undefined;
  aroundLabel?: string | undefined;
  heightLabel?: string | undefined;
  distanceLabel?: string | undefined;
  /** How a value reads, per part (screen readers, the line under each pane). */
  format?: ((v: number, part: "around" | "height" | "distance") => string) | undefined;
  size?: "sm" | "md" | undefined;
  disabled?: boolean | undefined;
}>(), {
  aroundStep: 1, heightMin: -45, heightMax: 90, heightStep: 1, distanceMin: 0, distanceMax: 1, distanceStep: 0.01,
  aroundMarks: () => [{ at: 0, label: "front" }, { at: 90, label: "right" }, { at: 180, label: "back" }, { at: -90, label: "left" }],
  heightMarks: () => [{ at: 0, label: "eye level" }, { at: 90, label: "above" }],
  variant: "camera", aroundLabel: "Around", heightLabel: "Height", distanceLabel: "Distance", size: "md",
});

const emit = defineEmits<{
  (e: "update:modelValue", v: [number, number, number]): void;
  (e: "change", v: [number, number, number]): void;
}>();

/** Radii in the top view: the nearest and farthest the point goes. */
const INNER = 12;
const OUTER = 38;
const SIDE_INNER = 14;

const topEl = ref<HTMLElement | null>(null);
const sideEl = ref<HTMLElement | null>(null);
const dragging = ref<"top" | "side" | null>(null);

const around = computed(() => snapAngle(props.modelValue[0], props.aroundStep));
const height = computed(() => snap(props.modelValue[1], props.heightMin, props.heightMax, props.heightStep));
const dist = computed(() => snap(props.modelValue[2], props.distanceMin, props.distanceMax, props.distanceStep));

const topR = computed(() => radiusOf(dist.value, props.distanceMin, props.distanceMax, INNER, OUTER));
const sideR = computed(() => radiusOf(dist.value, props.distanceMin, props.distanceMax, SIDE_INNER, SIDE_RADIUS));
const topAt = computed(() => aroundPoint(around.value, topR.value));
const sideAt = computed(() => heightPoint(height.value, sideR.value));
const arcPath = computed(() => heightArc(props.heightMin, props.heightMax, sideR.value));
const fullArc = computed(() => heightArc(props.heightMin, props.heightMax, SIDE_RADIUS));

const topMarks = computed(() => props.aroundMarks.map((m) => {
  const [l, t] = aroundPoint(wrapAngle(m.at), 45);
  return { ...m, l, t, side: l > 60 ? "end" : l < 40 ? "start" : undefined, on: Math.abs(wrapAngle(around.value - m.at)) < 22.5 };
}));
const sideMarks = computed(() => props.heightMarks
  .filter((m) => m.at >= props.heightMin && m.at <= props.heightMax)
  .map((m) => {
    const [l, t] = heightPoint(m.at, SIDE_RADIUS);
    return { ...m, l, t, up: m.at > 45, on: Math.abs(height.value - m.at) < 10 };
  }));

const say = (v: number, part: "around" | "height" | "distance"): string => (props.format ? props.format(v, part) : part === "distance" ? String(v) : `${v}°`);
const aroundText = computed(() => `${say(around.value, "around")}, ${props.distanceLabel} ${say(dist.value, "distance")}`);
const heightText = computed(() => say(height.value, "height"));

function set(next: [number, number, number]): [number, number, number] {
  const [a, h, d] = props.modelValue;
  if (!props.disabled && (next[0] !== a || next[1] !== h || next[2] !== d)) emit("update:modelValue", next);
  return next;
}

/** The pointer in the pane's 0..100 box. */
function boxAt(el: HTMLElement | null, ev: PointerEvent): [number, number] | null {
  const r = el?.getBoundingClientRect();
  if (!r || !(r.width > 0) || !(r.height > 0)) return null;
  return [((ev.clientX - r.left) / r.width) * 100, ((ev.clientY - r.top) / r.height) * 100];
}

function fromTop(ev: PointerEvent): [number, number, number] {
  const p = boxAt(topEl.value, ev);
  if (!p) return [around.value, height.value, dist.value];
  const dx = p[0] - 50;
  const dy = p[1] - 50;
  const a = snapAngle(aroundOf(dx, dy), props.aroundStep);
  const d = snap(distOf(Math.hypot(dx, dy), props.distanceMin, props.distanceMax, INNER, OUTER), props.distanceMin, props.distanceMax, props.distanceStep);
  return [a, height.value, d];
}

function fromSide(ev: PointerEvent): [number, number, number] {
  const p = boxAt(sideEl.value, ev);
  if (!p) return [around.value, height.value, dist.value];
  const h = snap(heightOf(p[0], p[1], props.heightMin, props.heightMax), props.heightMin, props.heightMax, props.heightStep);
  return [around.value, h, dist.value];
}

function onDown(pane: "top" | "side", ev: PointerEvent): void {
  if (props.disabled || ev.button !== 0) return;
  ev.preventDefault();
  dragging.value = pane;
  (ev.currentTarget as HTMLElement).setPointerCapture?.(ev.pointerId);
  set(pane === "top" ? fromTop(ev) : fromSide(ev));
  (pane === "top" ? topEl : sideEl).value?.querySelector<HTMLElement>("[role=slider]")?.focus();
}

function onMove(ev: PointerEvent): void {
  if (dragging.value) set(dragging.value === "top" ? fromTop(ev) : fromSide(ev));
}

function onUp(ev: PointerEvent): void {
  if (!dragging.value) return;
  dragging.value = null;
  (ev.currentTarget as HTMLElement).releasePointerCapture?.(ev.pointerId);
  emit("change", [around.value, height.value, dist.value]);
}

function onTopKey(ev: KeyboardEvent): void {
  if (props.disabled) return;
  const big = ev.shiftKey ? 10 : 1;
  let next: [number, number, number] | null = null;
  const turn = (by: number): number => snapAngle(around.value + by, props.aroundStep);
  const far = (by: number): number => snap(dist.value + by, props.distanceMin, props.distanceMax, props.distanceStep);
  switch (ev.key) {
    case "ArrowRight": next = [turn(props.aroundStep * big), height.value, dist.value]; break;
    case "ArrowLeft": next = [turn(-props.aroundStep * big), height.value, dist.value]; break;
    case "ArrowUp": next = [around.value, height.value, far(props.distanceStep * big)]; break;
    case "ArrowDown": next = [around.value, height.value, far(-props.distanceStep * big)]; break;
    case "Home": next = [0, height.value, dist.value]; break;
    case "End": next = [180, height.value, dist.value]; break;
    default: return;
  }
  ev.preventDefault();
  emit("change", set(next));
}

function onSideKey(ev: KeyboardEvent): void {
  if (props.disabled) return;
  const by = props.heightStep * (ev.shiftKey ? 10 : 1);
  const moves: Record<string, number> = { ArrowUp: by, ArrowRight: by, ArrowDown: -by, ArrowLeft: -by, PageUp: by * 10, PageDown: -by * 10 };
  const move = moves[ev.key];
  const h = ev.key === "Home" ? props.heightMin : ev.key === "End" ? props.heightMax
    : move === undefined ? null : snap(height.value + move, props.heightMin, props.heightMax, props.heightStep);
  if (h === null) return;
  ev.preventDefault();
  emit("change", set([around.value, h, dist.value]));
}
</script>

<template>
  <div
    class="wp-orbit"
    role="group"
    :aria-label="ariaLabel"
    :data-size="size"
    :data-variant="variant"
    :data-disabled="disabled || undefined"
    :data-dragging="dragging || undefined"
  >
    <div class="wp-orbit__pane">
      <span class="wp-orbit__cap" aria-hidden="true">{{ aroundLabel }}</span>
      <div
        ref="topEl" class="wp-orbit__box" data-pane="top"
        @pointerdown="onDown('top', $event)" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp"
      >
        <svg class="wp-orbit__svg" viewBox="0 0 100 100" aria-hidden="true">
          <circle class="wp-orbit__ring" cx="50" cy="50" :r="OUTER" />
          <circle class="wp-orbit__ring wp-orbit__ring--in" cx="50" cy="50" :r="INNER" />
          <circle class="wp-orbit__path" cx="50" cy="50" :r="topR" />
          <line class="wp-orbit__stem" x1="50" y1="50" :x2="topAt[0]" :y2="topAt[1]" />
          <!-- The subject from above, its nose toward the front (down). -->
          <circle class="wp-orbit__subject" cx="50" cy="50" r="6" />
          <path class="wp-orbit__nose" d="M 46 54 L 50 60 L 54 54 Z" />
        </svg>
        <span
          v-for="m in topMarks" :key="`a${m.at}`" class="wp-orbit__mark" :data-side="m.side" :data-on="m.on || undefined"
          :style="{ left: `${m.l}%`, top: `${m.t}%` }" aria-hidden="true"
        >{{ m.label }}</span>
        <!-- Focusable unless disabled (tabindex is bound). -->
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          class="wp-orbit__thumb"
          role="slider"
          :tabindex="disabled ? -1 : 0"
          :aria-label="aroundLabel"
          aria-valuemin="-180"
          aria-valuemax="180"
          :aria-valuenow="around"
          :aria-valuetext="aroundText"
          :aria-disabled="disabled || undefined"
          :style="{ left: `${topAt[0]}%`, top: `${topAt[1]}%` }"
          @keydown="onTopKey"
        />
      </div>
      <span class="wp-orbit__value">{{ say(around, "around") }} · {{ say(dist, "distance") }}</span>
    </div>
    <div class="wp-orbit__pane">
      <span class="wp-orbit__cap" aria-hidden="true">{{ heightLabel }}</span>
      <div
        ref="sideEl" class="wp-orbit__box" data-pane="side"
        @pointerdown="onDown('side', $event)" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp"
      >
        <svg class="wp-orbit__svg" viewBox="0 0 100 100" aria-hidden="true">
          <line class="wp-orbit__ground" x1="4" :y1="SIDE_CENTRE[1] + 6" x2="96" :y2="SIDE_CENTRE[1] + 6" />
          <path class="wp-orbit__ring" :d="fullArc" />
          <path class="wp-orbit__path" :d="arcPath" />
          <line class="wp-orbit__stem" :x1="SIDE_CENTRE[0]" :y1="SIDE_CENTRE[1]" :x2="sideAt[0]" :y2="sideAt[1]" />
          <!-- The subject from the side: a head over a body. -->
          <circle class="wp-orbit__subject" :cx="SIDE_CENTRE[0]" :cy="SIDE_CENTRE[1] - 4" r="4" />
          <rect class="wp-orbit__subject" :x="SIDE_CENTRE[0] - 3" :y="SIDE_CENTRE[1]" width="6" height="6" rx="1.5" />
        </svg>
        <span
          v-for="m in sideMarks" :key="`h${m.at}`" class="wp-orbit__mark wp-orbit__mark--side"
          :data-up="m.up || undefined" :data-on="m.on || undefined"
          :style="{ left: `${m.l}%`, top: `${m.t}%` }" aria-hidden="true"
        >{{ m.label }}</span>
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          class="wp-orbit__thumb"
          role="slider"
          :tabindex="disabled ? -1 : 0"
          :aria-label="heightLabel"
          :aria-valuemin="heightMin"
          :aria-valuemax="heightMax"
          :aria-valuenow="height"
          :aria-valuetext="heightText"
          :aria-disabled="disabled || undefined"
          :style="{ left: `${sideAt[0]}%`, top: `${sideAt[1]}%` }"
          @keydown="onSideKey"
        />
      </div>
      <span class="wp-orbit__value">{{ heightText }}</span>
    </div>
  </div>
</template>

<style scoped>
.wp-orbit {
  --_thumb: 16px;
  --_halo: 5px;
  --_tone: var(--wp-accent);
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px; width: 100%;
}
.wp-orbit[data-size="sm"] { --_thumb: 13px; --_halo: 4px; gap: 4px; }
.wp-orbit[data-variant="light"] { --_tone: var(--wp-amber); }
.wp-orbit__pane { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.wp-orbit__cap, .wp-orbit__value {
  font-size: 10.5px; line-height: 13px; color: var(--wp-text-muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.wp-orbit__value { color: var(--wp-text); font-variant-numeric: tabular-nums; text-align: center; }
.wp-orbit__box {
  position: relative; aspect-ratio: 1; box-sizing: border-box;
  background: var(--wp-bg-1); box-shadow: inset 0 0 0 1px var(--wp-border);
  border-radius: min(8px, var(--wp-radius-cap, 999px));
  cursor: crosshair; touch-action: none; user-select: none;
}
.wp-orbit__svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.wp-orbit__ring { fill: none; stroke: var(--wp-border-strong); stroke-width: 0.8; stroke-dasharray: 2 2.5; }
.wp-orbit__ring--in { stroke-opacity: 0.5; }
.wp-orbit__path { fill: none; stroke: color-mix(in srgb, var(--_tone) 45%, transparent); stroke-width: 1; }
.wp-orbit__stem { stroke: var(--_tone); stroke-width: 1.4; stroke-linecap: round; }
.wp-orbit[data-variant="light"] .wp-orbit__stem { stroke-dasharray: 2 2; }
.wp-orbit__ground { stroke: var(--wp-border-strong); stroke-width: 0.8; }
.wp-orbit__subject { fill: var(--wp-text-muted); }
.wp-orbit__nose { fill: var(--wp-text-muted); opacity: 0.7; }
.wp-orbit__mark {
  position: absolute; transform: translate(-50%, -50%); pointer-events: none;
  font-size: 9px; line-height: 11px; color: var(--wp-text-muted); white-space: nowrap;
}
/* Words stay inside their pane: hug the ring on the side they sit. */
.wp-orbit__mark[data-side="start"] { transform: translate(-2px, -50%); }
.wp-orbit__mark[data-side="end"] { transform: translate(calc(-100% + 2px), -50%); }
.wp-orbit__mark--side { transform: translate(-50%, calc(var(--_thumb) / 2 + 3px)); }
.wp-orbit__mark--side[data-up] { transform: translate(6px, -50%); }
.wp-orbit__mark[data-on] { color: var(--_tone); font-weight: 600; }
.wp-orbit__thumb {
  position: absolute; box-sizing: border-box; width: var(--_thumb); height: var(--_thumb);
  margin: calc(var(--_thumb) / -2) 0 0 calc(var(--_thumb) / -2);
  border: 3px solid var(--_tone); border-radius: min(50%, var(--wp-radius-cap, 999px));
  background: var(--wp-bg); outline: none;
  box-shadow: 0 0 0 var(--_halo) color-mix(in srgb, var(--_tone) 20%, transparent), var(--wp-shadow-sm);
  transition: transform var(--wp-motion-quick), box-shadow var(--wp-motion-quick);
}
.wp-orbit[data-variant="light"] .wp-orbit__thumb { background: var(--_tone); }
.wp-orbit__box:hover .wp-orbit__thumb { transform: scale(1.1); }
.wp-orbit__thumb:focus-visible { box-shadow: var(--wp-focus-ring), 0 0 0 var(--_halo) color-mix(in srgb, var(--_tone) 20%, transparent); }
.wp-orbit[data-disabled] { opacity: 0.45; }
.wp-orbit[data-disabled] .wp-orbit__box { cursor: not-allowed; }
.wp-orbit[data-disabled] .wp-orbit__thumb { transform: none; }
@media (prefers-reduced-motion: reduce) {
  .wp-orbit__thumb { transition: none; }
}
</style>
