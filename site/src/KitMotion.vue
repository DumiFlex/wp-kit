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
import Button from "@kit/Button.vue";
import LoadingMark from "@kit/LoadingMark.vue";
import Modal from "@kit/Modal.vue";
import Popover from "@kit/Popover.vue";
import ProgressBar from "@kit/ProgressBar.vue";
import Skeleton from "@kit/Skeleton.vue";
import Timeline from "@kit/Timeline.vue";
import WpSegmented from "@kit/WpSegmented.vue";
import { useToast } from "@kit/useToast";

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
const modalOpen = ref(false);
const spinning = ref(true);

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
.wp-motion__pop { margin: 0; max-width: 220px; font-size: var(--wp-text-sm); }
</style>
