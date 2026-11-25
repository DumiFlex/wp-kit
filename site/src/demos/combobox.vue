<script setup lang="ts">
import { ref } from "vue";
import Combobox from "@kit/Combobox.vue";

const models = [
  { value: "sdxl", label: "SDXL base", hint: "1024 px, tags or sentences" },
  { value: "pony", label: "Pony Diffusion V6", hint: "Score and source tags" },
  { value: "illustrious", label: "Illustrious XL" },
  { value: "flux", label: "Flux.1 dev", hint: "Sentences" },
  { value: "sd15", label: "SD 1.5", disabled: true, hint: "Not installed" },
];
const categories = ["Characters", "Clothing", "Lighting", "Places", "Poses", "Quality", "Styles", "Weather"]
  .map((c) => ({ value: c.toLowerCase(), label: c }));
const model = ref<string | null>("pony");
const cats = ref<string[]>(["lighting", "styles"]);
const none = ref<string | null>(null);
const canvas = ref<string | null>("flux");
const rows = [
  { value: "a", label: "Mood", icon: "pi-sparkles", iconColor: "var(--wp-kind-wildcard)" },
  { value: "b", label: "Outfit colour", icon: "pi-arrow-right-arrow-left", iconColor: "var(--wp-kind-derivation)", hint: "seed only" },
  { value: "c", label: "Quality tags", icon: "pi-tag", iconColor: "var(--wp-kind-fixed)", hint: "seed only" },
];
const picked = ref<string[]>(["a"]);
</script>

<template>
  <div class="wp-kit__stack">
    <Combobox v-model="model" :options="models" aria-label="Model" clearable />
    <Combobox v-model="cats" multiple :options="categories" aria-label="Categories" placeholder="Add a category" />
    <Combobox v-model="none" :options="models" aria-label="Invalid" invalid />
    <Combobox :model-value="'$seed'" :options="[{ value: '$seed', label: '$seed' }, { value: '$mood', label: '$mood' }, { value: '$outfit_color', label: '$outfit_color' }]" aria-label="Variable" mono />
    <Combobox :model-value="'sdxl'" :options="models" aria-label="Disabled" disabled />
    <Combobox v-model="picked" multiple :options="rows" aria-label="Rows with icons" placeholder="Pick rows" />
    <div class="wp-kit__canvas">
      <p class="wp-kit__caption">Canvas, size sm</p>
      <Combobox v-model="canvas" :options="models" size="sm" aria-label="Canvas model" />
    </div>
  </div>
</template>
