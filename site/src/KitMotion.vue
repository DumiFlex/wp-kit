<script setup lang="ts">
/**
 * Every animation in the kit in one place, so a change to one can be looked
 * at closely: a speed switch (normal, ¼, 1⁄10) and Pause act on every
 * animation in this section, including the entrances started from it.
 * A piece that animates from script (no CSS animation) reads the same speed
 * from `data-wp-motion-speed` on this section's root.
 */
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import Badge from "@kit/Badge.vue";
import Banner from "@kit/Banner.vue";
import Button from "@kit/Button.vue";
import LoadingMark from "@kit/LoadingMark.vue";
import Modal from "@kit/Modal.vue";
import Popover from "@kit/Popover.vue";
import ProgressBar from "@kit/ProgressBar.vue";
import Skeleton from "@kit/Skeleton.vue";
import Timeline from "@kit/Timeline.vue";
import WorkingLine from "@kit/WorkingLine.vue";
import WpSegmented from "@kit/WpSegmented.vue";
import { useToast } from "@kit/useToast";
import { useWorkingDemo } from "./working-demo";

const SPEEDS = [
  { value: "1", label: "Normal" },
  { value: "0.25", label: "¼ speed" },
  { value: "0.1", label: "1⁄10 speed" },
];
const speed = ref("1");
const paused = ref(false);
const root = ref<HTMLElement | null>(null);

/** Sets every CSS animation and transition under the section to the chosen
 *  speed and play state. Entrances (a popover, a toast) start later, so
 *  `animationstart` / `transitionrun` catch them as they begin. */
function tune(target?: Element): void {
  const el = target ?? root.value;
  if (!el) return;
  for (const a of el.getAnimations({ subtree: true })) {
    a.playbackRate = Number(speed.value);
    if (paused.value) a.pause();
    else if (a.playState === "paused") a.play();
  }
}
function onStart(e: Event): void {
  if (e.target instanceof Element) tune(e.target);
}
// Toasts, popovers and dialogs mount outside this section (teleported), so
// their entrances are tuned from the document while the section is shown.
function onDocStart(e: Event): void {
  const t = e.target;
  if (t instanceof Element && t.closest(".wp-toast-host, .wp-popover, .wp-modal, .wp-modal-backdrop, [role='dialog']")) tune(t);
}
watch([speed, paused], () => tune());
onMounted(() => {
  document.addEventListener("animationstart", onDocStart, true);
  document.addEventListener("transitionrun", onDocStart, true);
});
onBeforeUnmount(() => {
  document.removeEventListener("animationstart", onDocStart, true);
  document.removeEventListener("transitionrun", onDocStart, true);
});

const toast = useToast();
function showToast(): void {
  toast.push({ severity: "success", summary: "Saved Hair colour" });
}
const popOpen = ref(false);
const flashKey = ref(0);
const bannerKey = ref(0);
const modalOpen = ref(false);
const spinning = ref(true);

const { word, time } = useWorkingDemo();
const TEMPOS = ["slow", "mid", "fast"] as const;
const MARKS = ["typing", "shuffle", "orbit", "burst"] as const;

/* The AI entrances, played as they happen in the chat: a reply streams in a
 * run of words at a time, a reaction pops onto it, the Explain/Ask chip rises
 * by a selection, and the pack builder drops in a question that pulses. */
const REPLY = ["Here are", " three hair", " colours that", " suit a", " warm palette:", " auburn,", " copper", " and honey."];
const shownRuns = ref<string[]>([]);
const reacted = ref(false);
const chip = ref(false);
const ask = ref(false);
const playKey = ref(0);
let streamTimer: ReturnType<typeof setTimeout> | undefined;
function playAi(): void {
  clearTimeout(streamTimer);
  playKey.value += 1;
  shownRuns.value = [];
  reacted.value = false;
  chip.value = false;
  ask.value = false;
  // Steps keep pace with the section's speed switch.
  const step = (ms: number): number => ms / Number(speed.value);
  let i = 0;
  const next = (): void => {
    if (paused.value) { streamTimer = setTimeout(next, 200); return; }
    if (i < REPLY.length) {
      shownRuns.value = [...shownRuns.value, REPLY[i] ?? ""];
      i += 1;
      streamTimer = setTimeout(next, step(180));
      return;
    }
    if (!reacted.value) { reacted.value = true; streamTimer = setTimeout(next, step(500)); return; }
    if (!chip.value) { chip.value = true; streamTimer = setTimeout(next, step(700)); return; }
    ask.value = true;
  };
  next();
}
onMounted(playAi);
onBeforeUnmount(() => clearTimeout(streamTimer));

const STEPS = [
  { id: 1, title: "Read the request", time: "2s", tone: "success" as const, icon: "pi-check" },
  { id: 2, title: "Drafting options", time: "now", tone: "accent" as const, pending: true },
];
</script>

<template>
  <div
    ref="root"
    class="wp-motion"
    :data-wp-motion-speed="speed"
    :data-wp-motion-paused="paused ? 'true' : undefined"
    data-test="kit-motion"
    @animationstart="onStart"
    @transitionrun="onStart"
  >
    <div class="wp-motion__bar">
      <WpSegmented v-model="speed" :options="SPEEDS" aria-label="Animation speed" test-prefix="motion-speed" />
      <Button size="sm" :icon="paused ? 'pi-play' : 'pi-pause'" :pressed="paused" data-test="motion-pause" @click="paused = !paused">
        {{ paused ? "Play" : "Pause" }}
      </Button>
    </div>

    <div class="wp-motion__grid">
      <figure class="wp-motion__tile wp-motion__tile--wide" data-test="motion-ai-working">
        <div class="wp-motion__ai-grid" role="group" aria-label="Marks by tempo">
          <span class="wp-motion__ai-head" aria-hidden="true" />
          <span v-for="t in TEMPOS" :key="t" class="wp-motion__ai-head">{{ t }}</span>
          <template v-for="m in MARKS" :key="m">
            <span class="wp-motion__ai-head">{{ m }}</span>
            <WorkingLine v-for="t in TEMPOS" :key="`${m}-${t}`" :word="word" :time="time" :variant="m" :tempo="t" :label="`${m}, ${t}`" />
          </template>
        </div>
        <figcaption>
          <b>AI working line</b> WorkingLine's four marks (typing, shuffle, orbit, burst) at the three tempos: slow while the
          model reads, mid while it thinks, fast while it writes. The word crossfades and its box widens or narrows to fit.
        </figcaption>
      </figure>

      <figure class="wp-motion__tile wp-motion__tile--wide" data-test="motion-ai-entrances">
        <div :key="playKey" class="wp-motion__ai-play">
          <div class="wp-motion__ai-msg">
            <p class="wp-motion__ai-text"><span v-for="(r, i) in shownRuns" :key="i" class="wp-enter-fade">{{ r }}</span></p>
            <span v-if="reacted" class="wp-motion__ai-react wp-enter-pop" aria-label="Reacted thumbs up">👍</span>
          </div>
          <div class="wp-motion__ai-sel-wrap">
            <span v-if="chip" class="wp-motion__ai-sel wp-enter-rise">
              <i class="pi pi-sparkles" aria-hidden="true" /> Explain <span class="wp-motion__ai-sep" /> <i class="pi pi-comment" aria-hidden="true" /> Ask
            </span>
            <span class="wp-motion__ai-selected">copper</span>
          </div>
          <div v-if="ask" class="wp-motion__ai-ask wp-enter-drop wp-attention">
            <b><i class="pi pi-globe" aria-hidden="true" /> Search the web?</b>
            <span>The pack builder asks before it looks anything up.</span>
          </div>
        </div>
        <div class="wp-motion__bar">
          <Button size="sm" icon="pi-replay" data-test="motion-ai-replay" @click="playAi">Play again</Button>
        </div>
        <figcaption>
          <b>AI entrances</b> A reply streams in a run of words at a time (wp-enter-fade), a reaction pops on (wp-enter-pop), the
          Explain / Ask chip rises by a selection (wp-enter-rise) and the pack builder's question drops in and pulses
          (wp-enter-drop + wp-attention).
        </figcaption>
      </figure>

      <figure class="wp-motion__tile">
        <div class="wp-motion__stage wp-motion__stage--col">
          <div :key="`a${flashKey}`" class="wp-motion__flash-row" :class="{ 'wp-flash': flashKey > 0 }">Hair colour</div>
          <div :key="`b${flashKey}`" class="wp-motion__flash-row" :class="{ 'wp-flash': flashKey > 0 }" style="--wp-flash-color: var(--wp-kind-combine)">Outfit (a combine)</div>
        </div>
        <div class="wp-motion__bar">
          <Button size="sm" icon="pi-bolt" data-test="motion-flash" @click="flashKey++">Flash</Button>
        </div>
        <figcaption>
          <b>Flash</b> wp-flash: one ring and glow on the row that just changed (a drop, a value a run wrote). --wp-flash-color picks the colour.
        </figcaption>
      </figure>

      <figure class="wp-motion__tile">
        <div class="wp-motion__stage wp-motion__stage--col">
          <Banner :key="bannerKey" animate tone="warn" size="sm" title="Unsaved draft">Restored from 2 minutes ago.</Banner>
        </div>
        <div class="wp-motion__bar">
          <Button size="sm" icon="pi-replay" data-test="motion-banner" @click="bannerKey++">Show again</Button>
        </div>
        <figcaption>
          <b>Banner entrance</b> Banner animate drops a notice in as it appears.
        </figcaption>
      </figure>

      <figure class="wp-motion__tile wp-motion__tile--wide">
        <div class="wp-motion__stage">
          <LoadingMark :size="64" variant="logo" label="Loading, 64 px" />
          <LoadingMark :size="40" variant="logo" label="Loading, 40 px" />
          <LoadingMark :size="24" variant="logo" label="Loading, 24 px" />
          <LoadingMark :size="40" variant="sparkle" label="Sparkle, 40 px" />
          <LoadingMark :size="24" variant="sparkle" label="Sparkle, 24 px" />
          <LoadingMark>Loading bundle…</LoadingMark>
        </div>
        <figcaption><b>LoadingMark</b> The logo (64, 40, 24 px) and the sparkle (40, 24, 14 px inline).</figcaption>
      </figure>

      <figure class="wp-motion__tile">
        <div class="wp-motion__stage">
          <LoadingMark :size="40" variant="logo" brand="community" label="Loading, community" />
          <LoadingMark :size="24" variant="sparkle" brand="community" label="Sparkle, community" />
          <Button loading>Saving</Button>
        </div>
        <figcaption><b>Community colours, busy button</b> The same marks in the site's colours, and a button's own mark.</figcaption>
      </figure>

      <figure class="wp-motion__tile">
        <div class="wp-motion__stage wp-motion__stage--col">
          <Skeleton shape="row" />
          <Skeleton :lines="2" />
        </div>
        <figcaption><b>Skeleton</b> The shimmer over content that is still loading.</figcaption>
      </figure>

      <figure class="wp-motion__tile">
        <div class="wp-motion__stage wp-motion__stage--col">
          <ProgressBar :value="null" label="Working" />
          <ProgressBar :value="62" label="Importing" show-value />
        </div>
        <figcaption><b>ProgressBar</b> Busy with no end yet, and a known amount.</figcaption>
      </figure>

      <figure class="wp-motion__tile">
        <div class="wp-motion__stage">
          <Badge dot pulse tone="accent" label="Live" />
          <Badge :count="3" pulse tone="danger" label="3 new" />
          <button
            type="button"
            class="wp-btn wp-btn--ghost wp-btn--icon wp-refresh-btn"
            :class="{ 'wp-refresh-btn--spin': spinning }"
            aria-label="Refresh"
            @click="spinning = !spinning"
          >
            <i class="pi pi-refresh" aria-hidden="true" />
          </button>
        </div>
        <figcaption><b>Badge pulse, refresh spin</b> Click the refresh button to stop or start it.</figcaption>
      </figure>

      <figure class="wp-motion__tile">
        <div class="wp-motion__stage wp-motion__stage--col">
          <Timeline :items="STEPS" size="sm" aria-label="Steps" />
        </div>
        <figcaption><b>Timeline</b> A step that is still running pulses.</figcaption>
      </figure>

      <figure class="wp-motion__tile">
        <div class="wp-motion__stage">
          <Popover v-model:open="popOpen" label="Popover entrance">
            <template #trigger="{ props }">
              <Button v-bind="props" size="sm">Popover</Button>
            </template>
            <p class="wp-motion__pop">A popover opens with a short rise.</p>
          </Popover>
          <Button size="sm" @click="modalOpen = true">Dialog</Button>
          <Button size="sm" @click="showToast">Toast</Button>
        </div>
        <figcaption><b>Entrances</b> Open each one; slow speed applies to them too.</figcaption>
      </figure>
    </div>

    <Modal v-model:open="modalOpen" title="A dialog" size="sm">
      <p>A dialog fades its backdrop and pops in.</p>
      <template #footer>
        <Button variant="primary" @click="modalOpen = false">Close</Button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.wp-motion { display: flex; flex-direction: column; gap: var(--wp-space-4); }
.wp-motion__bar { display: flex; flex-wrap: wrap; gap: var(--wp-space-3); align-items: center; }
.wp-motion__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--wp-space-4); }
.wp-motion__tile {
  margin: 0; display: flex; flex-direction: column; gap: var(--wp-space-3); min-width: 0;
  padding: var(--wp-space-4); background: var(--wp-bg-1); border: 1px solid var(--wp-border);
  border-radius: min(10px, var(--wp-radius-cap, 999px));
}
.wp-motion__tile--wide { grid-column: 1 / -1; }
.wp-motion__stage { display: flex; flex-wrap: wrap; align-items: center; gap: var(--wp-space-5); min-height: 72px; }
.wp-motion__stage--col { flex-direction: column; align-items: stretch; gap: var(--wp-space-3); }
.wp-motion__tile figcaption { font-size: var(--wp-text-sm); color: var(--wp-text-muted); }
.wp-motion__tile figcaption b { color: var(--wp-text); font-weight: 600; margin-right: 6px; }
.wp-motion__flash-row { padding: var(--wp-space-3) var(--wp-space-4); border: 1px solid var(--wp-border); border-radius: var(--wp-radius); background: var(--wp-bg-2); font-size: var(--wp-text-sm); }
.wp-motion__pop { margin: 0; max-width: 220px; font-size: var(--wp-text-sm); }
.wp-motion__ai-grid {
  display: grid; grid-template-columns: 64px repeat(3, minmax(0, 1fr)); gap: var(--wp-space-4) var(--wp-space-6);
  align-items: center; overflow-x: auto;
}
.wp-motion__ai-grid > * { min-width: 0; }
.wp-motion__ai-head {
  color: var(--wp-text-dim); font-size: var(--wp-text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
}
@media (max-width: 760px) {
  .wp-motion__ai-grid { grid-template-columns: 56px repeat(3, minmax(220px, 1fr)); }
}
.wp-motion__ai-play { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--wp-space-6); min-height: 96px; }
.wp-motion__ai-msg { position: relative; max-width: 320px; flex: 1 1 240px; }
.wp-motion__ai-text {
  margin: 0; padding: var(--wp-space-3) var(--wp-space-4); min-height: 40px;
  background: var(--wp-bg-2); border: 1px solid var(--wp-border); border-radius: min(10px, var(--wp-radius-cap, 999px));
  font-size: var(--wp-text-sm); color: var(--wp-text);
}
.wp-motion__ai-react {
  position: absolute; right: -6px; bottom: -10px;
  display: inline-grid; place-items: center; width: 24px; height: 24px;
  background: var(--wp-bg-1); border: 1px solid var(--wp-border); border-radius: var(--wp-radius-cap, 999px);
  box-shadow: var(--wp-shadow-sm); font-size: 13px; line-height: 1;
}
.wp-motion__ai-sel-wrap { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; padding-top: 2px; }
.wp-motion__ai-sel {
  display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 8px;
  background: var(--wp-bg-1); border: 1px solid color-mix(in oklab, var(--wp-accent-500) 45%, var(--wp-border));
  border-radius: min(8px, var(--wp-radius-cap, 999px)); box-shadow: var(--wp-shadow-md);
  font-size: 12px; color: var(--wp-text);
}
.wp-motion__ai-sel .pi { font-size: 12px; color: var(--wp-accent-text); }
.wp-motion__ai-sep { width: 1px; height: 14px; background: var(--wp-border); margin: 0 3px; }
.wp-motion__ai-selected {
  padding: 0 2px; border-radius: 2px; font-size: var(--wp-text-sm); color: var(--wp-text);
  background: color-mix(in oklab, var(--wp-accent-500) 30%, transparent);
}
.wp-motion__ai-sel-wrap:not(:has(.wp-motion__ai-sel)) { padding-top: 36px; }
.wp-motion__ai-ask {
  display: flex; flex-direction: column; gap: 4px; max-width: 260px; padding: var(--wp-space-3) var(--wp-space-4);
  background: var(--wp-bg-2); border: 1px solid var(--wp-accent-400); border-radius: min(10px, var(--wp-radius-cap, 999px));
  font-size: var(--wp-text-xs); color: var(--wp-text-muted);
}
.wp-motion__ai-ask b { display: flex; align-items: center; gap: 6px; font-size: var(--wp-text-sm); color: var(--wp-text); }
.wp-motion__ai-ask .pi { color: var(--wp-accent-text); }
</style>
