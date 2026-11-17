<script setup lang="ts">
/**
 * TrianglePad: a mix of three things as one point in a triangle whose
 * corners are the three things. The closer the point to a corner, the more
 * of that thing; the three shares always add up to `total` (100: percents).
 * Made for blends (three styles, three moods, three LoRAs).
 *
 *   <TrianglePad v-model="mix" :labels="['Watercolour', 'Ink', 'Oil']" aria-label="Style mix" />
 *
 * `v-model` is `[a, b, c]`: corner 0 on top, 1 bottom left, 2 bottom right,
 * each a whole number of `step`s. `grid` draws lines at every quarter of
 * each share, `format` says a share in words (the corner words, screen
 * readers). Spokes from the point to each corner grow with their share.
 *
 * Keyboard: the point is one focus stop (role slider, read as
 * "Watercolour 50%, Ink 30%, Oil 20%"). The arrows move it on the triangle
 * (Shift: further), Home puts it in the middle (equal shares) and 1, 2, 3
 * send it to a corner.
 */
import { computed, ref } from "vue";
import { CORNERS, TRI_HEIGHT, pointOf, roundShares, shareLine, sharesAt, type Shares } from "./triangle";

const props = withDefaults(defineProps<{
  modelValue: Shares;
  /** The three things, corner 0 (top), 1 (bottom left), 2 (bottom right). */
  labels?: readonly [string, string, string] | undefined;
  /** What the three shares add up to. */
  total?: number | undefined;
  /** Each share is a whole number of these. */
  step?: number | undefined;
  /** Lines at every quarter of each share. */
  grid?: boolean | undefined;
  /** How a share reads (corner words, screen readers). */
  format?: ((v: number, corner: 0 | 1 | 2) => string) | undefined;
  ariaLabel?: string | undefined;
  size?: "sm" | "md" | undefined;
  disabled?: boolean | undefined;
}>(), { labels: () => ["A", "B", "C"], total: 100, step: 5, grid: true, size: "md" });

const emit = defineEmits<{ (e: "update:modelValue", v: Shares): void; (e: "change", v: Shares): void }>();

const boxEl = ref<HTMLElement | null>(null);
const dragging = ref(false);
const IDS = [0, 1, 2] as const;

const shares = computed<Shares>(() => roundShares(props.modelValue, props.total, props.step));
const at = computed(() => pointOf(shares.value));
const outline = CORNERS.map(([x, y]) => `${x},${y}`).join(" ");
const gridLines = computed(() => (props.grid ? IDS.flatMap((c) => [0.25, 0.5, 0.75].map((t) => ({ key: `${c}-${t}`, d: shareLine(c, t) }))) : []));

const say = (v: number, c: 0 | 1 | 2): string => (props.format ? props.format(v, c) : props.total === 100 ? `${v}%` : String(v));
const valueText = computed(() => IDS.map((c) => `${props.labels[c]} ${say(shares.value[c], c)}`).join(", "));
const spokeWidth = (c: 0 | 1 | 2): number => 0.6 + (shares.value[c] / (props.total || 1)) * 2.4;

function set(next: Shares): Shares {
  const cur = shares.value;
  if (!props.disabled && next.some((v, i) => v !== cur[i])) emit("update:modelValue", next);
  return next;
}

function fromPointer(ev: PointerEvent): Shares {
  const r = boxEl.value?.getBoundingClientRect();
  if (!r || r.width <= 0 || r.height <= 0) return shares.value;
  const x = ((ev.clientX - r.left) / r.width) * 100;
  const y = ((ev.clientY - r.top) / r.height) * 100;
  return roundShares(sharesAt(x, y), props.total, props.step);
}

function onDown(ev: PointerEvent): void {
  if (props.disabled || ev.button !== 0) return;
  ev.preventDefault();
  dragging.value = true;
  (ev.currentTarget as HTMLElement).setPointerCapture?.(ev.pointerId);
  set(fromPointer(ev));
  boxEl.value?.querySelector<HTMLElement>("[role=slider]")?.focus();
}

function onMove(ev: PointerEvent): void {
  if (dragging.value) set(fromPointer(ev));
}

function onUp(ev: PointerEvent): void {
  if (!dragging.value) return;
  dragging.value = false;
  (ev.currentTarget as HTMLElement).releasePointerCapture?.(ev.pointerId);
  emit("change", shares.value);
}

const MOVES: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/** The shares one key press away, or null for a key the pad ignores. */
function keyShares(key: string, shift: boolean): Shares | null {
  const corner = ["1", "2", "3"].indexOf(key);
  if (corner >= 0) return roundShares(IDS.map((c) => (c === corner ? 1 : 0)), props.total, props.step);
  if (key === "Home") return roundShares([1, 1, 1], props.total, props.step);
  const dir = MOVES[key];
  if (!dir) return null;
  // One step of share is this far across the box; try a little further until the rounded shares change.
  const unit = (TRI_HEIGHT * props.step) / (props.total || 1) * (shift ? 4 : 1);
  const [x, y] = at.value;
  for (let n = 1; n <= 4; n++) {
    const next = roundShares(sharesAt(x + dir[0] * unit * n, y + dir[1] * unit * n), props.total, props.step);
    if (next.some((v, i) => v !== shares.value[i])) return next;
  }
  return shares.value;
}

function onKey(ev: KeyboardEvent): void {
  if (props.disabled) return;
  const next = keyShares(ev.key, ev.shiftKey);
  if (!next) return;
  ev.preventDefault();
  emit("change", set(next));
}
</script>

<template>
  <div class="wp-tri" :data-size="size" :data-disabled="disabled || undefined" :data-dragging="dragging || undefined">
    <div
      ref="boxEl" class="wp-tri__box"
      @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp"
    >
      <svg class="wp-tri__svg" viewBox="0 0 100 100" aria-hidden="true">
        <polygon class="wp-tri__face" :points="outline" />
        <line v-for="g in gridLines" :key="g.key" class="wp-tri__grid" :x1="g.d[0]" :y1="g.d[1]" :x2="g.d[2]" :y2="g.d[3]" />
        <line
          v-for="c in IDS" :key="`s${c}`" class="wp-tri__spoke" :data-corner="c"
          :x1="at[0]" :y1="at[1]" :x2="CORNERS[c][0]" :y2="CORNERS[c][1]" :stroke-width="spokeWidth(c)"
        />
        <circle v-for="c in IDS" :key="`c${c}`" class="wp-tri__corner" :data-corner="c" :cx="CORNERS[c][0]" :cy="CORNERS[c][1]" r="2.6" />
      </svg>
      <span
        v-for="c in IDS" :key="`l${c}`" class="wp-tri__label" :data-corner="c"
        :data-top="shares[c] === Math.max(...shares) || undefined" aria-hidden="true"
      ><span class="wp-tri__name">{{ props.labels[c] }}</span> <b class="wp-tri__share">{{ say(shares[c], c) }}</b></span>
      <!-- Focusable unless disabled (tabindex is bound). -->
      <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
      <div
        class="wp-tri__thumb"
        role="slider"
        :tabindex="disabled ? -1 : 0"
        :aria-label="ariaLabel"
        aria-valuemin="0"
        :aria-valuemax="total"
        :aria-valuenow="shares[0]"
        :aria-valuetext="valueText"
        :aria-disabled="disabled || undefined"
        :style="{ left: `${at[0]}%`, top: `${at[1]}%` }"
        @keydown="onKey"
      />
    </div>
  </div>
</template>

<style scoped>
.wp-tri {
  --_thumb: 16px;
  --_halo: 5px;
  width: 100%;
}
.wp-tri[data-size="sm"] { --_thumb: 13px; --_halo: 4px; }
.wp-tri__box {
  position: relative; aspect-ratio: 1; box-sizing: border-box;
  background: var(--wp-bg-1); box-shadow: inset 0 0 0 1px var(--wp-border);
  border-radius: min(8px, var(--wp-radius-cap, 999px));
  cursor: crosshair; touch-action: none; user-select: none;
}
.wp-tri__svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.wp-tri__face { fill: color-mix(in srgb, var(--wp-text) 3%, transparent); stroke: var(--wp-border-strong); stroke-width: 0.8; stroke-linejoin: round; }
.wp-tri__grid { stroke: var(--wp-border); stroke-width: 0.5; stroke-dasharray: 1.5 2; }
.wp-tri__spoke { stroke: var(--_c); stroke-linecap: round; opacity: 0.8; }
.wp-tri__corner { fill: var(--_c); }
[data-corner="0"] { --_c: var(--wp-amber); }
[data-corner="1"] { --_c: var(--wp-teal); }
[data-corner="2"] { --_c: var(--wp-violet); }
.wp-tri__label {
  position: absolute; max-width: 48%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; pointer-events: none;
  font-size: 10.5px; line-height: 13px; color: var(--wp-text-muted);
}
.wp-tri__label[data-corner="0"] { top: 2%; left: 50%; transform: translateX(-50%); }
.wp-tri__label[data-corner="1"] { bottom: 2%; left: 3%; }
.wp-tri__label[data-corner="2"] { bottom: 2%; right: 3%; text-align: right; }
.wp-tri__share { font-weight: 600; color: var(--_c); font-variant-numeric: tabular-nums; }
.wp-tri__label[data-top] .wp-tri__name { color: var(--wp-text); }
.wp-tri__thumb {
  position: absolute; box-sizing: border-box; width: var(--_thumb); height: var(--_thumb);
  margin: calc(var(--_thumb) / -2) 0 0 calc(var(--_thumb) / -2);
  border: 3px solid var(--wp-accent); border-radius: min(50%, var(--wp-radius-cap, 999px));
  background: var(--wp-bg); outline: none;
  box-shadow: 0 0 0 var(--_halo) color-mix(in srgb, var(--wp-accent) 20%, transparent), var(--wp-shadow-sm);
  transition: transform var(--wp-motion-quick), box-shadow var(--wp-motion-quick);
}
.wp-tri__box:hover .wp-tri__thumb, .wp-tri[data-dragging] .wp-tri__thumb { transform: scale(1.1); }
.wp-tri__thumb:focus-visible { box-shadow: var(--wp-focus-ring), 0 0 0 var(--_halo) color-mix(in srgb, var(--wp-accent) 20%, transparent); }
.wp-tri[data-disabled] { opacity: 0.45; }
.wp-tri[data-disabled] .wp-tri__box { cursor: not-allowed; }
.wp-tri[data-disabled] .wp-tri__thumb { transform: none; }
@media (prefers-reduced-motion: reduce) {
  .wp-tri__thumb { transition: none; }
}
</style>
