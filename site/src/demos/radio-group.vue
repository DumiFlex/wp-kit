<script setup lang="ts">
import { ref } from "vue";
import RadioGroup from "@kit/RadioGroup.vue";
import Badge from "@kit/Badge.vue";

type Style = "tags" | "sentences" | "both";
const styles: { value: Style; label: string; hint?: string; disabled?: boolean }[] = [
  { value: "tags", label: "Tags", hint: "Danbooru-style, comma separated" },
  { value: "sentences", label: "Sentences", hint: "Natural language, for Flux and SD3" },
  { value: "both", label: "Both", hint: "Needs a model that reads both", disabled: true },
];
const style = ref<Style>("tags");
const mode = ref<"merge" | "replace">("merge");
const canvas = ref<"seed" | "fixed" | "random">("seed");
const where = ref<"cloud" | "local">("local");
const accent = ref("violet");
const named = ref("theme");
const swatches = [
  { value: "violet", label: "Violet", color: "#7c3aed" },
  { value: "teal", label: "Teal", color: "#22d3ee" },
  { value: "amber", label: "Amber", color: "#fbbf24" },
  { value: "rose", label: "Rose", color: "#fb7185" },
];
</script>

<template>
  <div class="wp-kit__stack">
    <RadioGroup v-model="style" :options="styles" aria-label="Prompt style" />
    <RadioGroup v-model="accent" :options="swatches" variant="swatch" aria-label="Accent colour" />
    <p class="wp-kit__caption">named, with the swatch slot drawing "Theme's own" and "Custom"</p>
    <RadioGroup
      v-model="named"
      :options="[{ value: 'theme', label: 'Theme\'s own' }, ...swatches.slice(0, 4), { value: 'custom', label: 'Custom' }]"
      variant="swatch"
      named
      aria-label="Accent colour, named"
    >
      <template #swatch="{ option }">
        <span
          class="wp-kit__swatch-fill"
          :style="{ background: option.value === 'theme'
            ? 'linear-gradient(135deg, var(--wp-accent) 50%, var(--wp-bg-3) 50%)'
            : option.value === 'custom'
              ? 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
              : option.color }"
        />
      </template>
    </RadioGroup>
    <RadioGroup
      v-model="mode"
      :options="[{ value: 'merge', label: 'Merge', hint: 'Keep my edits' }, { value: 'replace', label: 'Replace', hint: 'Take theirs' }]"
      orientation="horizontal"
      cards
      aria-label="Install mode"
    />
    <RadioGroup
      v-model="where"
      :options="[{ value: 'cloud', label: 'Claude' }, { value: 'local', label: 'LM Studio' }]"
      orientation="horizontal"
      cards
      aria-label="Provider"
    >
      <template #label="{ option }">
        {{ option.label }}
        <Badge :text="option.value === 'local' ? 'Local' : 'Cloud'" :tone="option.value === 'local' ? 'success' : 'warn'" dot />
      </template>
    </RadioGroup>
    <div class="wp-kit__canvas">
      <p class="wp-kit__caption">Canvas, size sm</p>
      <RadioGroup
        v-model="canvas"
        :options="[{ value: 'seed', label: 'From seed' }, { value: 'fixed', label: 'Fixed' }, { value: 'random', label: 'Random' }]"
        orientation="horizontal"
        size="sm"
        aria-label="Seed mode"
      />
    </div>
  </div>
</template>

<style scoped>
.wp-kit__swatch-fill { display: block; width: 100%; height: 100%; }
</style>
