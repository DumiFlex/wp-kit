<script setup lang="ts">
/**
 * WorkingLine: "the model is working", in one line like Claude Code's. A
 * small mark drawn from the logo's sparkles, a word that crossfades when it
 * changes, and the time so far. It only draws: the app decides the word,
 * the time and the tempo (the extension's AiWorking cycles playful words
 * and the real status, and reads the request's phase).
 *
 *   <WorkingLine word="Thinking" time="12s" tempo="mid" />
 *   <WorkingLine :word="word" :word-key="phase" variant="orbit" inline />
 *
 * Marks (`variant`): typing (three stars hop in turn), shuffle (the small
 * stars swap places round the big one), orbit (the logo's four nodes circle
 * the stars) or burst (the small stars fly out of the big one and back).
 * `tempo` sets their speed: slow while the model reads, mid while it thinks,
 * fast while it writes.
 *
 * The word crossfades in place when `wordKey` changes (default: the word),
 * so a token count ticking up can keep its key and not flicker. Its box is
 * never narrower than the word: it widens at once and narrows smoothly once
 * the old word has mostly faded.
 *
 * The marks move on a canvas over the still SVG, so they stay sharp and
 * glide in every browser (`canvas-motion.ts` says why); the SVG is the first
 * paint and stays under reduced motion, where it only breathes.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { BRAND_COLOURS, STAR_A, STAR_B, STAR_BIG, type LogoBrand } from "./logo-paths";
import { canvasBox, useCanvasMotion } from "./canvas-motion";
import { TEMPO_MS, TYPING_X, drawWorking, orbitNodes, type WorkingVariant } from "./working-line-motion";

export type { WorkingVariant } from "./working-line-motion";

const props = withDefaults(defineProps<{
  /** What is shown, without the "…" (the line adds it). */
  word: string;
  /** What the crossfade keys on; defaults to the word. */
  wordKey?: string | undefined;
  /** Time so far, already formatted ("42s"). Left out, no time shows. */
  time?: string | undefined;
  variant?: WorkingVariant | undefined;
  tempo?: "slow" | "mid" | "fast" | undefined;
  /** The mark's size in px. */
  size?: number | undefined;
  /** Smaller text and a capped word width, for a top bar. */
  inline?: boolean | undefined;
  /** The whole status, for screen readers and the tooltip; defaults to the word. */
  label?: string | undefined;
  brand?: LogoBrand | undefined;
}>(), { variant: "typing", tempo: "slow", size: 22, inline: false, brand: "extension" });

const key = computed(() => props.wordKey ?? props.word);
const name = computed(() => props.label ?? props.word);

const colours = computed(() => BRAND_COLOURS[props.brand]);
const BIG = computed(() => colours.value[0]);
const A = computed(() => colours.value[1]);
const B = computed(() => colours.value[2]);
/** The logo's four nodes for the orbit, with steps between the colours. */
const nodes = computed(() => orbitNodes(colours.value));
/** Typing stars: the big sparkle drawn small three times in a row. */
const typing = computed(() => TYPING_X.map((x, i) => [x, [A.value, BIG.value, B.value][i] ?? BIG.value] as const));

const canvas = ref<HTMLCanvasElement | null>(null);
const canvasStyle = computed(() => canvasBox(props.size));
const { live, drawn } = useCanvasMotion(canvas, (ctx, width, ms) =>
  drawWorking(ctx, width, ms, props.variant, TEMPO_MS[props.tempo], colours.value));

const measure = ref<HTMLElement | null>(null);
const boxWidth = ref<number | null>(null);
const growing = ref(false);
async function fit(): Promise<void> {
  await nextTick();
  // Rounded up, plus a pixel to spare: one pixel short is enough for the
  // browser to swap the word's end for its own "…", which Firefox draws
  // invisibly on this gradient text.
  const raw = measure.value?.getBoundingClientRect().width ?? 0;
  const w = raw ? Math.ceil(raw) + 1 : 0;
  if (!w || w === boxWidth.value) return;
  growing.value = boxWidth.value === null || w > boxWidth.value;
  boxWidth.value = w;
}
watch(() => props.word, () => { void fit(); });

// The word's width can also change on its own, when the font loads late.
let resized: ResizeObserver | null = null;
onMounted(() => {
  void fit();
  if (typeof ResizeObserver !== "undefined" && measure.value) {
    resized = new ResizeObserver(() => { void fit(); });
    resized.observe(measure.value);
  }
});
onBeforeUnmount(() => resized?.disconnect());
</script>

<template>
  <div
    class="wp-wl"
    :data-tempo="tempo"
    :data-variant="variant"
    :data-inline="inline ? 'true' : undefined"
    :data-drawn="drawn ? 'true' : undefined"
    role="status"
    :aria-label="name"
    :title="name"
    :style="{ '--wp-wl-big': BIG, '--wp-wl-a': A, '--wp-wl-b': B }"
  >
    <span class="wp-wl__art" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg class="wp-wl__logo" viewBox="0 0 1024 1024" :width="size" :height="size" aria-hidden="true">
      <template v-if="variant === 'typing'">
        <path
          v-for="([x, c], i) in typing" :key="i" :style="{ fill: c }"
          :transform="`translate(${x - 256} 256) scale(.5)`" :d="STAR_BIG"
        />
      </template>
      <g v-else-if="variant === 'shuffle'" transform="translate(512 512) scale(1.45) translate(-512 -512)">
        <path :style="{ fill: BIG }" :d="STAR_BIG" />
        <path :style="{ fill: A }" :d="STAR_A" />
        <path :style="{ fill: B }" :d="STAR_B" />
      </g>
      <template v-else-if="variant === 'orbit'">
        <circle v-for="([x, y, c], i) in nodes" :key="i" :style="{ fill: c }" :cx="x" :cy="y" r="70" />
        <path :style="{ fill: BIG }" :d="STAR_BIG" />
        <path :style="{ fill: A }" :d="STAR_A" />
        <path :style="{ fill: B }" :d="STAR_B" />
      </template>
      <g v-else transform="translate(512 512) scale(1.3) translate(-512 -512)">
        <path :style="{ fill: BIG }" :d="STAR_BIG" />
        <path :style="{ fill: A }" :d="STAR_A" />
        <path :style="{ fill: B }" :d="STAR_B" />
      </g>
    </svg>
    <canvas v-if="live" ref="canvas" class="wp-wl__canvas" :style="canvasStyle" aria-hidden="true" />
    </span>
    <span
      class="wp-wl__words"
      :data-grow="growing ? 'true' : undefined"
      :style="boxWidth ? { width: `${boxWidth}px` } : undefined"
    >
      <Transition name="wp-wl-word" type="transition">
        <span :key="key" class="wp-wl__word" data-test="working-line-word">{{ word }}…</span>
      </Transition>
      <span ref="measure" class="wp-wl__word wp-wl__measure" aria-hidden="true">{{ word }}…</span>
    </span>
    <span v-if="time !== undefined" class="wp-wl__time" data-test="working-line-time">{{ time }}</span>
  </div>
</template>

<style scoped>
.wp-wl {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--wp-text-muted);
  font-size: 13px;
  white-space: nowrap;
}
.wp-wl__logo { overflow: visible; }
.wp-wl__words {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  /* Narrows once the old word has mostly faded; widens at once. */
  transition: width 0.35s cubic-bezier(0.25, 0.8, 0.25, 1) 0.3s;
}
.wp-wl__words[data-grow="true"] { transition: none; }
.wp-wl__word {
  display: inline-block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  /* A light band sweeps over the gradient text, like Claude's own line.
     The band is a fixed white, like the logo's brand colours. */
  background:
    linear-gradient(100deg, transparent 35%, rgba(255, 255, 255, 0.75) 50%, transparent 65%) no-repeat,
    linear-gradient(90deg, var(--wp-wl-big), var(--wp-wl-a) 45%, var(--wp-wl-b));
  background-size: 250% 100%, 100% 100%;
  background-position: 150% 0, 0 0;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: wp-wl-shimmer 2.6s linear infinite;
}
@keyframes wp-wl-shimmer {
  0% { background-position: 150% 0, 0 0; }
  70%, 100% { background-position: -50% 0, 0 0; }
}
/* Sized like the word, never seen: what the box grows or shrinks to. */
.wp-wl__measure {
  position: absolute; left: 0; top: 0;
  visibility: hidden; pointer-events: none; animation: none;
  max-width: none; overflow: visible;
}
.wp-wl__time { flex-shrink: 0; font-variant-numeric: tabular-nums; color: var(--wp-text-dim); }
.wp-wl[data-inline="true"] { font-size: 12px; }
.wp-wl[data-inline="true"] .wp-wl__words { max-width: 240px; }
/* Crossfade in place: the old word fades out on top of the new one. The
 * fade and blur run through registered custom properties (see the marks
 * below for why): an `opacity` / `filter` transition lifts the word onto a
 * compositor layer, which re-rasterises the text and snaps it to whole
 * pixels as the fade begins. The leaving word keeps its exact spot (top 0,
 * the box is one word tall), with no -50% translate to land between pixels. */
.wp-wl-word-enter-active, .wp-wl-word-leave-active {
  opacity: var(--wp-wl-wo);
  filter: blur(var(--wp-wl-wb));
  transition: --wp-wl-wo 0.45s ease, --wp-wl-wb 0.45s ease;
}
.wp-wl-word-leave-active { position: absolute; left: 0; top: 0; }
.wp-wl-word-enter-from, .wp-wl-word-leave-to { --wp-wl-wo: 0; --wp-wl-wb: 2px; }
@media (prefers-reduced-motion: reduce) {
  .wp-wl__word { animation: none; }
  .wp-wl__words { transition: none; }
  .wp-wl-word-enter-from, .wp-wl-word-leave-to { --wp-wl-wb: 0px; }
}

/* The marks move on the canvas; the SVG is the still mark under it. */
.wp-wl__art { position: relative; display: inline-block; flex-shrink: 0; line-height: 0; }
.wp-wl__logo { display: block; }
.wp-wl__canvas { position: absolute; pointer-events: none; }
.wp-wl[data-drawn="true"] .wp-wl__logo { visibility: hidden; }

@property --wp-wl-o { syntax: "<number>"; inherits: false; initial-value: 1; }
@property --wp-wl-wo { syntax: "<number>"; inherits: false; initial-value: 1; }
@property --wp-wl-wb { syntax: "<length>"; inherits: false; initial-value: 0px; }

@media (prefers-reduced-motion: reduce) {
  .wp-wl__logo { opacity: var(--wp-wl-o); animation: wp-wl-fade 2.4s ease-in-out infinite; }
  @keyframes wp-wl-fade { 0%, 100% { --wp-wl-o: 1; } 50% { --wp-wl-o: 0.55; } }
}
</style>
