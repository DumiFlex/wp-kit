<script setup lang="ts">
import { computed, ref } from "vue";
import TrianglePad from "@kit/TrianglePad.vue";

const mix = ref<[number, number, number]>([50, 30, 20]);
const small = ref<[number, number, number]>([34, 33, 33]);
const labels = ["watercolor", "ink sketch", "oil painting"] as const;
const prompt = computed(() => labels.map((l, i) => [l, mix.value[i] ?? 0] as const).filter(([, v]) => v > 0).map(([l, v]) => `(${l}:${(v / 100 * 1.5).toFixed(2)})`).join(", "));
</script>

<template>
  <div class="wp-kit__stack">
    <p class="wp-kit__caption">A style mix, as weights: {{ prompt }}</p>
    <div style="max-width: 260px">
      <TrianglePad v-model="mix" :labels="['Watercolour', 'Ink', 'Oil']" aria-label="Style mix" />
    </div>
    <div class="wp-kit__canvas">
      <p class="wp-kit__caption">Canvas, size sm, step 1, no grid</p>
      <div style="max-width: 180px">
        <TrianglePad v-model="small" size="sm" :step="1" :grid="false" :labels="['Calm', 'Tense', 'Joy']" aria-label="Mood mix" />
      </div>
      <TrianglePad :model-value="[20, 40, 40]" disabled aria-label="Disabled" style="max-width: 140px" />
    </div>
  </div>
</template>
