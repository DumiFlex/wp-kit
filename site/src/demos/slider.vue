<script setup lang="ts">
import { ref } from "vue";
import Slider from "@kit/Slider.vue";

const weight = ref(1);
const size = ref(32);
const pct = ref(60);
const brush = ref(24);
const weightRange = ref<[number, number]>([0.6, 1.2]);
const tokens = ref<[number, number]>([40, 120]);
const frames = ref<[number, number]>([2, 6]);
</script>

<template>
  <div class="wp-kit__stack">
    <Slider v-model="weight" :min="0" :max="2" :step="0.05" aria-label="Weight" with-input />
    <Slider
      v-model="size"
      :min="4"
      :max="160"
      :marks="[{ value: 16, label: '16' }, { value: 64, label: '64' }, { value: 128, label: '128' }]"
      :format="(v: number) => `${v} px`"
      aria-label="Brush size"
      show-value
    />
    <Slider v-model="pct" size="lg" :format="(v: number) => `${v}%`" aria-label="Threshold" show-value />
    <Slider v-model="pct" disabled aria-label="Disabled" show-value />
    <div class="wp-kit__canvas">
      <p class="wp-kit__caption">Canvas, size sm</p>
      <Slider v-model="brush" :min="4" :max="160" size="sm" aria-label="Brush" with-input />
    </div>
    <p class="wp-kit__caption">A pair: low and high on one track</p>
    <Slider v-model="weightRange" :min="0" :max="2" :step="0.05" aria-label="Weight" with-input />
    <Slider v-model="tokens" :min="0" :max="200" :step="5" :min-gap="20" :format="(v: number) => `${v} tokens`" aria-label="Token budget" show-value />
    <Slider :model-value="[20, 70]" disabled aria-label="Disabled" show-value />
    <div class="wp-kit__canvas">
      <p class="wp-kit__caption">Canvas pair, size sm</p>
      <Slider v-model="frames" :min="1" :max="10" size="sm" aria-label="Frames" with-input />
    </div>
  </div>
</template>
