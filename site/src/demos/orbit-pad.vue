<script setup lang="ts">
import { computed, ref } from "vue";
import OrbitPad from "@kit/OrbitPad.vue";

const view = ref<[number, number, number]>([-45, 30, 0.5]);
const light = ref<[number, number, number]>([120, 45, 0.3]);
const small = ref<[number, number, number]>([0, 0, 0.6]);

const SIDES = ["front", "front-right", "right side", "back-right", "back", "back-left", "left side", "front-left"];
const sideOf = (a: number): string => SIDES[((Math.round(a / 45) % 8) + 8) % 8] ?? "front";
const heightOf = (h: number): string => (h < -20 ? "low angle" : h < 15 ? "eye level" : h < 60 ? "high angle" : "top-down");
const shotOf = (d: number): string => (d < 0.25 ? "close-up" : d < 0.6 ? "medium shot" : "wide shot");
const words = (v: number, part: "around" | "height" | "distance"): string => (part === "around" ? sideOf(v) : part === "height" ? heightOf(v) : shotOf(v));
const phrase = computed(() => `${sideOf(view.value[0])} view, ${heightOf(view.value[1])}, ${shotOf(view.value[2])}`);
</script>

<template>
  <div class="wp-kit__stack">
    <p class="wp-kit__caption">A camera, with words from format: {{ phrase }}</p>
    <div style="max-width: 320px">
      <OrbitPad v-model="view" :around-step="15" :height-step="5" :format="words" aria-label="Camera" />
    </div>
    <p class="wp-kit__caption">variant="light", plain numbers: {{ light[0] }}°, {{ light[1] }}°, {{ light[2] }}</p>
    <div style="max-width: 320px">
      <OrbitPad v-model="light" variant="light" :height-min="0" :around-marks="[{ at: 0, label: 'front' }, { at: 180, label: 'behind' }]" :height-marks="[{ at: 0, label: 'low' }, { at: 90, label: 'overhead' }]" aria-label="Key light" />
    </div>
    <div class="wp-kit__canvas">
      <p class="wp-kit__caption">Canvas, size sm</p>
      <div style="max-width: 220px">
        <OrbitPad v-model="small" size="sm" :around-step="45" aria-label="Small orbit" />
      </div>
      <OrbitPad :model-value="[90, 20, 0.5]" disabled aria-label="Disabled" style="max-width: 160px" />
    </div>
  </div>
</template>
