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
 * Every mark animates registered custom properties, never `transform` or
 * `opacity` themselves, so the paths repaint sharp each frame instead of
 * going to a compositor layer that blurs them and snaps them to whole pixels.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { BRAND_COLOURS, STAR_A, STAR_B, STAR_BIG, type LogoBrand } from "./logo-paths";

export type WorkingVariant = "typing" | "shuffle" | "orbit" | "burst";

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
const nodes = computed(() => [
  [911, 512, B.value],
  [512, 911, `color-mix(in srgb, ${B.value} 70%, ${A.value})`],
  [113, 512, `color-mix(in srgb, ${BIG.value} 60%, ${A.value})`],
  [512, 113, A.value],
] as const);
/** Typing stars: the big sparkle drawn small three times in a row. */
const typing = computed(() => [[250, A.value], [512, BIG.value], [774, B.value]] as const);

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
    role="status"
    :aria-label="name"
    :title="name"
    :style="{ '--wp-wl-big': BIG, '--wp-wl-a': A, '--wp-wl-b': B }"
  >
    <svg class="wp-wl__logo" viewBox="0 0 1024 1024" :width="size" :height="size" aria-hidden="true">
      <template v-if="variant === 'typing'">
        <g v-for="([x, c], i) in typing" :key="i" class="wp-wl__hop" :style="{ '--wp-wl-k': i }">
          <path class="wp-wl__star" :style="{ fill: c }" :transform="`translate(${x - 256} 256) scale(.5)`" :d="STAR_BIG" />
        </g>
      </template>
      <g v-else-if="variant === 'shuffle'" transform="translate(512 512) scale(1.45) translate(-512 -512)">
        <path class="wp-wl__star wp-wl__star--big wp-wl__dip" :style="{ fill: BIG }" :d="STAR_BIG" />
        <g class="wp-wl__vb wp-wl__swap">
          <path class="wp-wl__star" :style="{ fill: A }" :d="STAR_A" />
          <path class="wp-wl__star" :style="{ fill: B }" :d="STAR_B" />
        </g>
      </g>
      <template v-else-if="variant === 'orbit'">
        <g class="wp-wl__vb wp-wl__spin">
          <circle
            v-for="([x, y, c], i) in nodes" :key="i" class="wp-wl__dot"
            :style="{ '--wp-wl-k': i, fill: c }" :cx="x" :cy="y" r="70"
          />
        </g>
        <path class="wp-wl__star wp-wl__star--big wp-wl__breathe" :style="{ fill: BIG }" :d="STAR_BIG" />
        <path class="wp-wl__star" :style="{ fill: A }" :d="STAR_A" />
        <path class="wp-wl__star" :style="{ fill: B }" :d="STAR_B" />
      </template>
      <g v-else transform="translate(512 512) scale(1.3) translate(-512 -512)">
        <path class="wp-wl__star wp-wl__star--big wp-wl__pop" :style="{ fill: BIG }" :d="STAR_BIG" />
        <path class="wp-wl__star wp-wl__burst" :style="{ fill: A, '--wp-wl-dx': '152px', '--wp-wl-dy': '-152px' }" :d="STAR_A" />
        <path class="wp-wl__star wp-wl__burst" :style="{ fill: B, '--wp-wl-dx': '-152px', '--wp-wl-dy': '152px' }" :d="STAR_B" />
      </g>
    </svg>
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
  --wp-wl-t: 2.8s;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--wp-text-muted);
  font-size: 13px;
  white-space: nowrap;
}
.wp-wl[data-tempo="mid"] { --wp-wl-t: 2.2s; }
.wp-wl[data-tempo="fast"] { --wp-wl-t: 1.5s; }
.wp-wl__logo { flex-shrink: 0; overflow: visible; }
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

/* Every mark animates registered custom properties, never `transform` or
 * `opacity` themselves. A `transform` / `opacity` animation goes to the
 * compositor, which lifts each path onto its own layer as it starts:
 * rasterised once at a fixed scale and snapped to whole pixels, so the sharp
 * mark went soft and jumped half a pixel the moment it began to move. A
 * custom property animates on the main thread and each frame repaints the
 * vector paths in place, as sharp as at rest. */
@property --wp-wl-x { syntax: "<length>"; inherits: false; initial-value: 0px; }
@property --wp-wl-f { syntax: "<number>"; inherits: false; initial-value: 0; }
@property --wp-wl-r { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@property --wp-wl-s { syntax: "<number>"; inherits: false; initial-value: 1; }
@property --wp-wl-o { syntax: "<number>"; inherits: false; initial-value: 1; }
@property --wp-wl-wo { syntax: "<number>"; inherits: false; initial-value: 1; }
@property --wp-wl-wb { syntax: "<length>"; inherits: false; initial-value: 0px; }

.wp-wl__star, .wp-wl__dot, .wp-wl__hop { transform-box: fill-box; transform-origin: center; }
.wp-wl__vb { transform-box: view-box; transform-origin: 512px 512px; }

/* Typing stars: each hops in turn. */
.wp-wl__hop {
  transform: translateY(var(--wp-wl-x)) scale(var(--wp-wl-s));
  animation: wp-wl-hop var(--wp-wl-t) ease-in-out infinite;
  animation-delay: calc(var(--wp-wl-t) * var(--wp-wl-k) * 0.15);
}
@keyframes wp-wl-hop {
  0%, 40%, 100% { --wp-wl-x: 0px; --wp-wl-s: 1; }
  20% { --wp-wl-x: -110px; --wp-wl-s: 1.12; }
}

/* Shuffle: the small stars swap places, the big one dips and turns. */
.wp-wl__swap {
  transform: rotate(var(--wp-wl-r));
  animation: wp-wl-swap calc(var(--wp-wl-t) * 2) cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
.wp-wl__dip {
  transform: rotate(var(--wp-wl-r)) scale(var(--wp-wl-s));
  animation: wp-wl-dip var(--wp-wl-t) cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
@keyframes wp-wl-swap {
  0%, 15% { --wp-wl-r: 0deg; }
  50%, 65% { --wp-wl-r: 180deg; }
  100% { --wp-wl-r: 360deg; }
}
@keyframes wp-wl-dip {
  0%, 15% { --wp-wl-s: 1; --wp-wl-r: 0deg; }
  32% { --wp-wl-s: 0.7; --wp-wl-r: 45deg; }
  50%, 100% { --wp-wl-s: 1; --wp-wl-r: 90deg; }
}

/* Orbit: the four nodes circle the stars and twinkle in turn. */
.wp-wl__spin {
  transform: rotate(var(--wp-wl-r));
  animation: wp-wl-spin calc(var(--wp-wl-t) * 2) cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite;
}
.wp-wl__dot {
  opacity: var(--wp-wl-o);
  transform: scale(var(--wp-wl-s));
  animation: wp-wl-twinkle var(--wp-wl-t) ease-in-out infinite;
  animation-delay: calc(var(--wp-wl-t) * var(--wp-wl-k) * -0.25);
}
.wp-wl__breathe {
  transform: scale(var(--wp-wl-s));
  animation: wp-wl-breathe var(--wp-wl-t) ease-in-out infinite;
}
@keyframes wp-wl-spin { from { --wp-wl-r: 0deg; } to { --wp-wl-r: 360deg; } }
@keyframes wp-wl-twinkle {
  0%, 100% { --wp-wl-o: 1; --wp-wl-s: 1; }
  50% { --wp-wl-o: 0.35; --wp-wl-s: 0.6; }
}
@keyframes wp-wl-breathe { 0%, 100% { --wp-wl-s: 1; } 50% { --wp-wl-s: 0.86; } }

/* Burst: the small stars fly out of the big one and back. `--wp-wl-f` is
 * how far out they are (1 = at --wp-wl-dx/dy, 0 = home). */
.wp-wl__burst {
  opacity: var(--wp-wl-o);
  transform:
    translate(calc(var(--wp-wl-dx) * var(--wp-wl-f)), calc(var(--wp-wl-dy) * var(--wp-wl-f)))
    scale(var(--wp-wl-s));
  animation: wp-wl-burst var(--wp-wl-t) cubic-bezier(0.3, 0, 0.2, 1) infinite;
}
.wp-wl__pop {
  transform: scale(var(--wp-wl-s));
  animation: wp-wl-pop var(--wp-wl-t) ease-in-out infinite;
}
@keyframes wp-wl-burst {
  0% { --wp-wl-f: 1; --wp-wl-s: 0; --wp-wl-o: 0; }
  15% { --wp-wl-o: 1; }
  45%, 75% { --wp-wl-f: 0; --wp-wl-s: 1.15; --wp-wl-o: 1; }
  100% { --wp-wl-f: 1; --wp-wl-s: 0; --wp-wl-o: 0; }
}
@keyframes wp-wl-pop { 0%, 100% { --wp-wl-s: 1.1; } 40% { --wp-wl-s: 0.8; } }

@media (prefers-reduced-motion: reduce) {
  .wp-wl__logo * { animation: none !important; }
  .wp-wl__logo { opacity: var(--wp-wl-o); animation: wp-wl-fade 2.4s ease-in-out infinite; }
  @keyframes wp-wl-fade { 0%, 100% { --wp-wl-o: 1; } 50% { --wp-wl-o: 0.55; } }
}
</style>
