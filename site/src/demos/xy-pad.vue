<script setup lang="ts">
import { computed, ref } from "vue";
import Slider from "@kit/Slider.vue";
import XYPad from "@kit/XYPad.vue";
import { stepDots } from "@kit/xy-pad";

const size = ref<[number, number]>([1024, 1344]);
const mood = ref<[number, number]>([0.3, 0.7]);
const small = ref<[number, number]>([0.5, 0.5]);
const picture = ref<[number, number]>([1024, 1344]);
const stickAt = ref<[number, number]>([0.3, -0.2]);
const map = ref<[number, number]>([0.7, 0.3]);
const gridAt = ref<[number, number]>([0.5, 0.5]);
const lamp = ref<[number, number]>([0.3, 0.7]);
const depth = ref(0.4);
const quarters = stepDots(0, 1, 0.25);
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
    <p class="wp-kit__caption">variant="size": area, ratio guides through 0,0 and a W × H readout</p>
    <div style="max-width: 300px">
      <XYPad v-model="picture" variant="size" :x-min="0" :x-max="2048" :x-step="64" :y-min="0" :y-max="2048" :y-step="64" :grid="0" aria-label="Picture size" x-label="Width" y-label="Height" />
    </div>
    <p class="wp-kit__caption">variant="stick": round, zero in the middle: {{ stickAt[0] }}, {{ stickAt[1] }}</p>
    <div style="max-width: 200px">
      <XYPad v-model="stickAt" variant="stick" :x-min="-1" :x-max="1" :y-min="-1" :y-max="1" :grid="0" :crosshair="false" aria-label="Pan" />
    </div>
    <p class="wp-kit__caption">Word bands on both axes, with tint: a colour per section</p>
    <div style="max-width: 300px">
      <XYPad v-model="map" :grid="0" tint :x-bands="[{ to: 0.33, label: 'calm' }, { to: 0.66, label: 'lively' }, { to: 1, label: 'wild' }]" :y-bands="[{ to: 0.5, label: 'dark' }, { to: 1, label: 'bright' }]" aria-label="Mood map" />
    </div>
    <p class="wp-kit__caption">Dots on every step (stepDots) and snap-dots: the point lands on a dot</p>
    <div style="max-width: 200px">
      <XYPad v-model="gridAt" :x-dots="quarters" :y-dots="quarters" snap-dots aria-label="Quarters" />
    </div>
    <p class="wp-kit__caption">ring: a third number on the pad, set by a fader beside it: {{ lamp[0] }}, {{ lamp[1] }}, {{ depth }}</p>
    <div style="display: flex; gap: 10px; align-items: stretch; max-width: 280px">
      <div style="flex: 1"><XYPad v-model="lamp" :ring="depth" :grid="4" aria-label="Light" x-label="Left to right" y-label="Low to high" /></div>
      <Slider v-model="depth" variant="fader" :min="0" :max="1" :step="0.01" aria-label="Distance"><template #label>Z</template></Slider>
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
