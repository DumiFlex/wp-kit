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
const cfg = ref(7);
const res = ref(1024);
const lora = ref(0.85);
const style = ref(0.6);
const shot = ref(0.45);
const faders = ref([0.85, 0.6, 1.2, 7]);
const SHOT_MARKS = [{ value: 0.3 }, { value: 0.7 }];
const shotWord = (v: number): string => (v <= 0.3 ? "close-up" : v <= 0.7 ? "medium shot" : "wide shot");
const RES_MARKS = [512, 768, 1024, 1280, 1536].map((v) => ({ value: v, label: String(v) }));
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
    <p class="wp-kit__caption">snap: only the marks (arrows go mark to mark)</p>
    <Slider v-model="res" :min="512" :max="1536" :marks="RES_MARKS" snap :format="(v: number) => `${v} px`" aria-label="Width" show-value />
    <p class="wp-kit__caption">:snap="1": pulled onto a mark near one, free elsewhere</p>
    <Slider v-model="cfg" :min="1" :max="15" :step="0.5" :marks="[{ value: 4.5, label: 'low' }, { value: 7, label: 'default' }, { value: 12, label: 'high' }]" :snap="1" aria-label="CFG" show-value />
    <p class="wp-kit__caption">A pair: low and high on one track</p>
    <Slider v-model="weightRange" :min="0" :max="2" :step="0.05" aria-label="Weight" with-input />
    <Slider v-model="tokens" :min="0" :max="200" :step="5" :min-gap="20" :format="(v: number) => `${v} tokens`" aria-label="Token budget" show-value />
    <Slider :model-value="[20, 70]" disabled aria-label="Disabled" show-value />
    <div class="wp-kit__canvas">
      <p class="wp-kit__caption">Canvas pair, size sm</p>
      <Slider v-model="frames" :min="1" :max="10" size="sm" aria-label="Frames" with-input />
    </div>
    <p class="wp-kit__caption">variant="bar": the row is the track (fine-step 0.01: Shift drags finer)</p>
    <Slider v-model="lora" variant="bar" :min="0" :max="1.5" :step="0.05" :fine-step="0.01" aria-label="Character LoRA"><template #label>Character LoRA</template></Slider>
    <Slider v-model="shot" variant="bar" :min="0" :max="1" :step="0.05" :marks="SHOT_MARKS" :format="shotWord" aria-label="Camera"><template #label>Camera</template></Slider>
    <div class="wp-kit__canvas">
      <p class="wp-kit__caption">Canvas bar, size sm, with-input</p>
      <Slider v-model="style" variant="bar" :min="0" :max="1.5" :step="0.05" size="sm" with-input aria-label="Style LoRA"><template #label>Style LoRA</template></Slider>
    </div>
    <p class="wp-kit__caption">variant="fader": upright tracks, value on top, label under</p>
    <div style="display: flex; gap: 12px">
      <Slider v-model="faders[0]" variant="fader" :min="0" :max="1.5" :step="0.05" show-value aria-label="Character"><template #label>Character</template></Slider>
      <Slider v-model="faders[1]" variant="fader" :min="0" :max="1.5" :step="0.05" show-value aria-label="Style"><template #label>Style</template></Slider>
      <Slider v-model="faders[2]" variant="fader" :min="0" :max="2" :step="0.1" show-value aria-label="Detail"><template #label>Detail</template></Slider>
      <Slider v-model="faders[3]" variant="fader" :min="1" :max="15" size="sm" with-input aria-label="CFG"><template #label>CFG</template></Slider>
    </div>
  </div>
</template>
