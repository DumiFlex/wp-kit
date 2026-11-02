<script setup lang="ts" generic="T extends number | [number, number]">
/**
 * Slider: a number picked by dragging along a range (a weight, a threshold,
 * a size). Use it when the feel of "more or less" matters more than the
 * exact number; add `with-input` to type the exact number too. Works on the
 * canvas (`size="sm"`) and in the manager (`md`).
 *
 *   <Slider v-model="weight" :min="0" :max="2" :step="0.05" aria-label="Weight" with-input />
 *   <Slider v-model="size" :min="4" :max="160" :marks="[{ value: 32, label: '32' }]" :format="(v) => `${v} px`" />
 *
 * Give it a pair (`v-model="range"` with `[low, high]`) for a low and a high
 * number on one track (a weight range, a token budget, a sweep's from–to):
 * two thumbs that can't cross, kept at least `min-gap` apart, and with
 * `with-input` a WpNumber for each end. A click on the track moves the
 * nearer thumb.
 *
 *   <Slider v-model="range" :min="0" :max="2" :step="0.1" :min-gap="0.2" aria-label="Weight" with-input />
 *
 * APG slider: each thumb is a focus stop; arrows move one step, PageUp /
 * PageDown ten, Home / End jump to the ends (for a pair, the ends that thumb
 * can reach), and `format` gives screen readers the value as words ("32 px").
 * A pair's thumbs are "<label>, low end" / "high end", their min and max the
 * other thumb, so screen readers hear the real limits. Clicking the track
 * jumps there and the drag carries on from it.
 */
import { computed, ref } from "vue";
import { keyStep, percentOf, snap, valueAt } from "./slider-math";
import WpNumber from "./WpNumber.vue";

const props = withDefaults(defineProps<{
  modelValue: T;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  /** A pair only: the smallest distance between the two ends. */
  minGap?: number | undefined;
  size?: "sm" | "md" | "lg" | undefined;
  disabled?: boolean | undefined;
  ariaLabel?: string | undefined;
  /** Labelled ticks under the track. */
  marks?: { value: number; label?: string }[] | undefined;
  /** How the value reads (the tooltip-free label and screen readers). */
  format?: ((v: number) => string) | undefined;
  /** Show the value (a pair: "low – high") after the track. */
  showValue?: boolean | undefined;
  /** Put a WpNumber after the track (a pair: one at each side) to type the exact value. */
  withInput?: boolean | undefined;
}>(), { min: 0, max: 100, step: 1, minGap: 0, size: "md", ariaLabel: undefined, marks: undefined });

const emit = defineEmits<{ (e: "update:modelValue", v: T): void; (e: "change", v: T): void }>();

const trackEl = ref<HTMLElement | null>(null);
/** The thumb being dragged (0 = the only one, or a pair's low end). */
const active = ref<0 | 1 | null>(null);

const isPair = computed(() => Array.isArray(props.modelValue));
const sn = (v: number): number => snap(v, props.min, props.max, props.step);

/** The thumbs' values: one, or a pair sorted low to high. */
const ends = computed<number[]>(() => {
  const m = props.modelValue;
  if (typeof m === "number") return [sn(m)];
  return [sn(Math.min(m[0], m[1])), sn(Math.max(m[0], m[1]))];
});
const lo = computed(() => ends.value[0] ?? props.min);
const hi = computed(() => ends.value[ends.value.length - 1] ?? props.max);
const pcts = computed(() => ends.value.map((v) => percentOf(v, props.min, props.max)));
const loPct = computed(() => pcts.value[0] ?? 0);
const hiPct = computed(() => pcts.value[pcts.value.length - 1] ?? 0);

const text = (v: number): string => (props.format ? props.format(v) : String(v));
const label = computed(() => props.ariaLabel ?? (isPair.value ? "Range" : undefined));

/** The lowest and highest value thumb `i` can take. */
function limits(i: number): [number, number] {
  if (!isPair.value) return [props.min, props.max];
  return i === 0 ? [props.min, hi.value - props.minGap] : [lo.value + props.minGap, props.max];
}

function thumbLabel(i: number): string | undefined {
  if (!isPair.value) return label.value;
  return `${label.value ?? "Range"}, ${i === 0 ? "low" : "high"} end`;
}

function asModel(vals: number[]): T {
  const out = isPair.value ? [vals[0] ?? lo.value, vals[1] ?? hi.value] : (vals[0] ?? lo.value);
  return out as T;
}

/** Put thumb `i` at `v` (a pair's thumb kept inside the other end minus the gap); returns the new model. */
function setEnd(i: 0 | 1, v: number): T {
  let vals: number[];
  if (!isPair.value) vals = [v];
  else if (i === 0) vals = [Math.min(v, sn(hi.value - props.minGap)), hi.value];
  else vals = [lo.value, Math.max(v, sn(lo.value + props.minGap))];
  const next = asModel(vals);
  if (!props.disabled && JSON.stringify(next) !== JSON.stringify(props.modelValue)) emit("update:modelValue", next);
  return next;
}

function current(): T {
  return asModel(ends.value);
}

function fromPointer(ev: PointerEvent): number {
  const r = trackEl.value?.getBoundingClientRect();
  return r ? valueAt(ev.clientX, r.left, r.width, props.min, props.max, props.step) : lo.value;
}

function onPointerDown(ev: PointerEvent): void {
  if (props.disabled || ev.button !== 0) return;
  ev.preventDefault();
  const v = fromPointer(ev);
  const i: 0 | 1 = isPair.value && (Math.abs(v - lo.value) > Math.abs(v - hi.value) || v > hi.value) ? 1 : 0;
  active.value = i;
  (ev.currentTarget as HTMLElement).setPointerCapture?.(ev.pointerId);
  setEnd(i, v);
  trackEl.value?.querySelectorAll<HTMLElement>("[role=slider]")[i]?.focus();
}

function onPointerMove(ev: PointerEvent): void {
  if (active.value !== null) setEnd(active.value, fromPointer(ev));
}

function onPointerUp(ev: PointerEvent): void {
  if (active.value === null) return;
  active.value = null;
  (ev.currentTarget as HTMLElement).releasePointerCapture?.(ev.pointerId);
  emit("change", current());
}

function onKeydown(ev: KeyboardEvent, i: 0 | 1): void {
  if (props.disabled) return;
  const next = keyStep(ev.key, i === 0 ? lo.value : hi.value, props.min, props.max, props.step);
  if (next === null) return;
  ev.preventDefault();
  const [low, high] = limits(i);
  const v = ev.key === "Home" ? low : ev.key === "End" ? high : next;
  emit("change", setEnd(i, v));
}

function onTyped(i: 0 | 1, v: number | null): void {
  if (v === null || props.disabled) return;
  emit("change", setEnd(i, sn(v)));
}

function passed(v: number): boolean {
  return isPair.value ? v >= lo.value && v <= hi.value : v <= lo.value;
}
</script>

<template>
  <div
    class="wp-slider"
    :data-size="size"
    :data-pair="isPair || undefined"
    :data-disabled="disabled || undefined"
    :data-dragging="active !== null || undefined"
    :data-marked="marks?.length ? 'true' : undefined"
  >
    <WpNumber
      v-if="withInput && isPair"
      class="wp-slider__input"
      :model-value="lo"
      :min="min"
      :max="hi - props.minGap"
      :step="step"
      :size="size"
      :disabled="disabled"
      :aria-label="thumbLabel(0)"
      @update:model-value="onTyped(0, $event)"
    />
    <div
      ref="trackEl"
      class="wp-slider__track"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div class="wp-slider__rail" />
      <div
        class="wp-slider__fill"
        :style="isPair
          ? { left: `${loPct}%`, width: `${hiPct - loPct}%` }
          : { width: `calc(${loPct}% + var(--_thumb) / 2)` }"
      />
      <span
        v-for="m in marks ?? []"
        :key="m.value"
        class="wp-slider__mark"
        :data-passed="passed(m.value) || undefined"
        :style="{ left: `${percentOf(m.value, props.min, props.max)}%` }"
        aria-hidden="true"
      ><span v-if="m.label" class="wp-slider__mark-label">{{ m.label }}</span></span>
      <!-- Focusable unless disabled (tabindex is bound). -->
      <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
      <div
        v-for="(v, i) in ends"
        :key="i"
        class="wp-slider__thumb"
        role="slider"
        :tabindex="disabled ? -1 : 0"
        :aria-label="thumbLabel(i)"
        :aria-valuemin="limits(i)[0]"
        :aria-valuemax="limits(i)[1]"
        :aria-valuenow="v"
        :aria-valuetext="format ? text(v) : undefined"
        :aria-disabled="disabled || undefined"
        :data-active="active === i || undefined"
        :style="{ left: `${pcts[i]}%` }"
        @keydown="onKeydown($event, i === 1 ? 1 : 0)"
      />
    </div>
    <span v-if="showValue && !withInput" class="wp-slider__value" aria-hidden="true">{{ isPair ? `${text(lo)} – ${text(hi)}` : text(lo) }}</span>
    <WpNumber
      v-if="withInput"
      class="wp-slider__input"
      :model-value="isPair ? hi : lo"
      :min="isPair ? lo + props.minGap : min"
      :max="max"
      :step="step"
      :size="size"
      :disabled="disabled"
      :aria-label="isPair ? thumbLabel(1) : (ariaLabel ? `${ariaLabel}, exact value` : 'Exact value')"
      @update:model-value="onTyped(isPair ? 1 : 0, $event)"
    />
  </div>
</template>

<style scoped>
.wp-slider {
  --_h: var(--wp-control-h-md);
  --_thumb: 16px;
  display: flex; align-items: center; gap: var(--wp-space-4); min-width: 0; width: 100%;
  min-height: var(--_h); font-family: var(--wp-font-sans);
}
.wp-slider[data-size="sm"] { --_h: var(--wp-control-h-sm); --_thumb: 12px; gap: var(--wp-space-3); }
.wp-slider[data-size="lg"] { --_h: var(--wp-control-h-lg); --_thumb: 18px; }
.wp-slider[data-marked] { padding-bottom: 14px; }
.wp-slider__track {
  position: relative; flex: 1; min-width: 60px; height: var(--_h);
  margin: 0 calc(var(--_thumb) / 2); cursor: pointer; touch-action: none;
}
.wp-slider[data-pair] .wp-slider__track { min-width: 80px; }
.wp-slider__rail, .wp-slider__fill {
  position: absolute; top: 50%; left: 0; height: 4px; margin-top: -2px; border-radius: var(--wp-radius-cap, 999px);
}
.wp-slider__rail { left: calc(var(--_thumb) / -2); right: calc(var(--_thumb) / -2); background: var(--wp-bg-3); box-shadow: inset 0 0 0 1px var(--wp-border-soft); }
.wp-slider__fill { left: calc(var(--_thumb) / -2); background: var(--wp-accent); }
.wp-slider[data-size="sm"] .wp-slider__rail, .wp-slider[data-size="sm"] .wp-slider__fill { height: 3px; margin-top: -1.5px; }
.wp-slider__thumb {
  position: absolute; top: 50%; box-sizing: border-box;
  width: var(--_thumb); height: var(--_thumb); margin: calc(var(--_thumb) / -2) 0 0 calc(var(--_thumb) / -2);
  border: 2px solid var(--wp-accent); border-radius: min(50%, var(--wp-radius-cap, 999px)); background: var(--wp-bg);
  box-shadow: var(--wp-shadow-sm); outline: none;
  transition: transform var(--wp-motion-quick), box-shadow var(--wp-motion-quick);
}
.wp-slider:not([data-pair]) .wp-slider__track:hover .wp-slider__thumb,
.wp-slider[data-pair] .wp-slider__thumb:hover,
.wp-slider__thumb[data-active] { transform: scale(1.12); }
.wp-slider__thumb:focus-visible { box-shadow: var(--wp-focus-ring); z-index: 1; }
.wp-slider__mark {
  position: absolute; top: 50%; width: 2px; height: 8px; margin: -4px 0 0 -1px; border-radius: min(1px, var(--wp-radius-cap, 999px));
  background: var(--wp-border-strong); pointer-events: none;
}
.wp-slider__mark[data-passed] { background: color-mix(in srgb, var(--wp-accent) 60%, var(--wp-bg)); }
.wp-slider__mark-label {
  position: absolute; top: calc(var(--_h) / 2 + 2px); left: 50%; transform: translateX(-50%);
  color: var(--wp-text-dim); font-size: 10px; line-height: 1; white-space: nowrap; font-variant-numeric: tabular-nums;
}
.wp-slider__value {
  flex: none; min-width: 3ch; text-align: right; color: var(--wp-text); font: 500 var(--wp-text-sm)/1 var(--wp-font-sans);
  font-variant-numeric: tabular-nums; white-space: nowrap;
}
.wp-slider[data-size="sm"] .wp-slider__value { font-size: var(--wp-text-xs); }
.wp-slider__input { flex: none; width: 84px; }
.wp-slider[data-pair] .wp-slider__input { width: 76px; }
.wp-slider[data-size="sm"] .wp-slider__input { width: 64px; }
.wp-slider[data-pair][data-size="sm"] .wp-slider__input { width: 60px; }
.wp-slider[data-disabled] { opacity: 0.45; }
.wp-slider[data-disabled] .wp-slider__track { cursor: not-allowed; }
.wp-slider[data-disabled] .wp-slider__thumb { transform: none; }
@media (prefers-reduced-motion: reduce) {
  .wp-slider__thumb { transition: none; }
}
</style>
