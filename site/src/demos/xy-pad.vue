<script setup lang="ts">
import { computed, ref } from "vue";
import XYPad from "@kit/XYPad.vue";

const size = ref<[number, number]>([1024, 1344]);
const mood = ref<[number, number]>([0.3, 0.7]);
const small = ref<[number, number]>([0.5, 0.5]);
const mp = computed(() => ((size.value[0] * size.value[1]) / 1_000_000).toFixed(2));
const moodWord = computed(() => `${mood.value[0] < 0.5 ? "calm" : "wild"}, ${mood.value[1] < 0.5 ? "dark" : "bright"}`);
</script>

<template>
  <div class="wp-kit__stack">
    <p class="wp-kit__caption">A picture size: area shades the box, the slot draws the 1:1 line. {{ size[0] }} × {{ size[1] }} ({{ mp }} MP)</p>
    <div style="max-width: 300px">
      <XYPad v-model="size" :x-min="512" :x-max="2048" :x-step="64" :y-min="512" :y-max="2048" :y-step="64" area aria-label="Size" x-label="Width" y-label="Height">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" stroke-opacity="0.25" stroke-dasharray="2 3" vector-effect="non-scaling-stroke" />
        </svg>
      </XYPad>
    </div>
    <p class="wp-kit__caption">A mood pad, wider than tall, with a fine step for Shift: {{ moodWord }}</p>
    <div style="max-width: 360px">
      <XYPad v-model="mood" :ratio="1.6" :fine-step="0.001" :grid="8" aria-label="Mood" x-label="Energy" y-label="Light" />
    </div>
    <div class="wp-kit__canvas">
      <p class="wp-kit__caption">Canvas, size sm, no crosshair</p>
      <div style="max-width: 160px">
        <XYPad v-model="small" size="sm" :crosshair="false" :grid="4" aria-label="Small pad" />
      </div>
      <XYPad :model-value="[0.2, 0.8]" disabled aria-label="Disabled" style="max-width: 120px" />
    </div>
  </div>
</template>
