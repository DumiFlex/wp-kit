<script lang="ts">
/** Gradient ids must be unique on the page. `useId` restarts per Vue app and
 *  the extension mounts many small apps, so count across all of them. */
let nextId = 0;
</script>

<script setup lang="ts">
/**
 * The loading mark. Two drawings, one per kind of place:
 *
 * - `logo` (pages and panels): the full logo. Its two rings slide apart and
 *   back while the big star dips and turns and the small stars twinkle. A
 *   `block` mark, or one 24 px or bigger, gets it by default.
 * - `sparkle` (tight inline spots: a text row, a button, a list item): the
 *   logo's three stars without the rings, the big one dipping while the small
 *   ones swap places, like the AI working line. Small marks get it by
 *   default, so an inline "Loading bundle…" is not a big colourful logo.
 *
 * Alone it is an icon (`size`, 14 inline and 40 as a block). With slot text it
 * becomes a row ("[mark] Loading bundle…"); with `block` it is centred in its
 * box, for a panel or page that is loading. `mono` draws it in the text
 * colour, for a host with its own colours (a busy button).
 */
import { computed, ref, useSlots } from "vue";
import { BRAND_COLOURS, RING_A, RING_B, STAR_A, STAR_B, STAR_BIG, type LogoBrand } from "./logo-paths";
import { canvasBox, useCanvasMotion } from "./canvas-motion";
import { drawPose, poseAt, type Look } from "./loading-mark-motion";

const props = withDefaults(defineProps<{
  /** Width and height in px. Default 14, or 40 with `block`. */
  size?: number | undefined;
  /** Accessible name when there is no slot text. */
  label?: string | undefined;
  /** Centre it (and its text, below) in the space it is given. */
  block?: boolean | undefined;
  /** Which drawing; default `logo` for a block or a 24 px+ mark, else `sparkle`. */
  variant?: "logo" | "sparkle" | undefined;
  /** Draw in the current text colour instead of the logo colours. */
  mono?: boolean | undefined;
  /** Hidden from screen readers, for a host that says it is busy itself
   *  (a button with `aria-busy`). */
  decorative?: boolean | undefined;
  /** Whose colours: the extension's (default) or the community site's. */
  brand?: LogoBrand | undefined;
}>(), { size: undefined, label: "Loading", block: false, variant: undefined, mono: false, decorative: false, brand: "extension" });

const slots = useSlots();
const id = `wp-lm-${nextId++}`;
const px = computed(() => props.size ?? (props.block ? 40 : 14));
const drawing = computed(() => props.variant ?? (props.block || px.value >= 24 ? "logo" : "sparkle"));
/** The logo's own colours (brand, not theme tokens: the mark looks the same
 *  in light and dark). */
const VIOLET = computed(() => BRAND_COLOURS[props.brand][0]);
const INDIGO = computed(() => BRAND_COLOURS[props.brand][1]);
const TEAL = computed(() => BRAND_COLOURS[props.brand][2]);
const fill = (colour: string): string => (props.mono ? "currentColor" : colour);

/* The SVG is the still mark (first paint, reduced motion, a page with no
 * canvas). Once mounted, a canvas over it draws the motion: see
 * `canvas-motion.ts` for why it is not CSS. */
const root = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const canvasStyle = computed(() => canvasBox(px.value));

let textColour = "";
let textColourAt = -Infinity;
function look(): Look {
  if (props.mono) {
    const now = performance.now();
    if (now - textColourAt > 500 && root.value) {
      textColour = getComputedStyle(root.value).color || "currentColor";
      textColourAt = now;
    }
    return { variant: drawing.value, colours: [textColour, textColour, textColour], flat: true };
  }
  return { variant: drawing.value, colours: [VIOLET.value, INDIGO.value, TEAL.value], flat: false };
}

const { live, drawn } = useCanvasMotion(canvas, (ctx, width, ms) => drawPose(ctx, width, look(), poseAt(ms)));
</script>

<template>
  <span
    ref="root"
    class="wp-lm"
    :class="{ 'wp-lm--block': block, 'wp-lm--drawn': drawn }"
    :role="decorative ? undefined : 'status'"
    :aria-label="decorative || slots.default ? undefined : label"
    :aria-hidden="decorative || undefined"
    data-test="loading-mark"
  >
    <span class="wp-lm__art" :style="{ width: `${px}px`, height: `${px}px` }">
    <svg
      class="wp-lm__svg"
      :data-variant="drawing"
      viewBox="0 0 1024 1024"
      :width="px"
      :height="px"
      aria-hidden="true"
    >
      <template v-if="drawing === 'logo'">
        <defs v-if="!mono">
          <linearGradient :id="`${id}a`" x1="312.56" y1="897.19" x2="312.56" y2="2" gradientUnits="userSpaceOnUse">
            <stop offset="0" :stop-color="VIOLET" />
            <stop offset="1" :stop-color="INDIGO" />
          </linearGradient>
          <linearGradient :id="`${id}b`" x1="711.44" y1="126.81" x2="711.44" y2="1022" gradientUnits="userSpaceOnUse">
            <stop offset="0" :stop-color="INDIGO" />
            <stop offset="1" :stop-color="TEAL" />
          </linearGradient>
        </defs>
        <path class="wp-lm__ring wp-lm__ring--a" :fill="fill(`url(#${id}a)`)" :d="RING_A" />
        <path class="wp-lm__ring wp-lm__ring--b" :fill="fill(`url(#${id}b)`)" :d="RING_B" />
        <path class="wp-lm__star wp-lm__star--big" :fill="fill(VIOLET)" :d="STAR_BIG" />
        <path class="wp-lm__star wp-lm__star--tw" :fill="fill(INDIGO)" :d="STAR_A" />
        <path class="wp-lm__star wp-lm__star--tw" :fill="fill(TEAL)" :d="STAR_B" />
      </template>
      <g v-else transform="translate(512 512) scale(1.45) translate(-512 -512)">
        <path class="wp-lm__star wp-lm__star--big" :fill="fill(VIOLET)" :d="STAR_BIG" />
        <g class="wp-lm__swap">
          <path class="wp-lm__star" :fill="fill(INDIGO)" :d="STAR_A" />
          <path class="wp-lm__star" :fill="fill(TEAL)" :d="STAR_B" />
        </g>
      </g>
    </svg>
    <canvas v-if="live" ref="canvas" class="wp-lm__canvas" :style="canvasStyle" aria-hidden="true" />
    </span>
    <span v-if="slots.default" class="wp-lm__text"><slot /></span>
  </span>
</template>

<style scoped>
.wp-lm {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  vertical-align: middle;
}
.wp-lm--block {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 48px 16px;
  color: var(--wp-text-muted);
  text-align: center;
}
.wp-lm__art { position: relative; display: inline-block; flex-shrink: 0; line-height: 0; }
.wp-lm__svg { display: block; overflow: visible; }
.wp-lm__canvas { position: absolute; pointer-events: none; }
.wp-lm--drawn .wp-lm__svg { visibility: hidden; }

/* Reduced motion: no canvas, the still mark breathes. A registered custom
 * property, not `opacity` itself, so the fade stays off the compositor (a
 * composited fade turns the mark soft). */
@property --wp-lm-o { syntax: "<number>"; inherits: false; initial-value: 1; }
@media (prefers-reduced-motion: reduce) {
  .wp-lm__svg { opacity: var(--wp-lm-o); animation: wp-lm-fade 2.4s ease-in-out infinite; }
  @keyframes wp-lm-fade { 0%, 100% { --wp-lm-o: 1; } 50% { --wp-lm-o: 0.55; } }
}
</style>
