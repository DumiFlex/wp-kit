<script setup lang="ts">
import { ref } from "vue";
import ChipToggle from "@kit/ChipToggle.vue";

const kind = ref<string>("all");
const kinds = [
  { id: "all", label: "All", icon: "pi-th-large", color: null },
  { id: "wildcard", label: "Wildcard", icon: "pi-sparkles", color: "var(--wp-kind-wildcard)" },
  { id: "fixed", label: "Fixed values", icon: "pi-tag", color: "var(--wp-kind-fixed)" },
  { id: "constraint", label: "Constraint", icon: "pi-filter", color: "var(--wp-kind-constraint)" },
];
const tags = ref<string[]>(["portrait"]);
function flip(t: string): void {
  tags.value = tags.value.includes(t) ? tags.value.filter((x) => x !== t) : [...tags.value, t];
}
</script>

<template>
  <div class="wp-kit__stack wp-kit__stack--wide">
    <div class="wp-kit__row">
      <ChipToggle
        v-for="k in kinds"
        :key="k.id"
        :pressed="kind === k.id"
        :icon="k.icon"
        :color="k.color"
        size="md"
        @click="kind = k.id"
      >{{ k.label }}</ChipToggle>
    </div>
    <div class="wp-kit__row">
      <ChipToggle
        v-for="(n, t) in { portrait: 12, noir: 4, watercolor: 31 }"
        :key="t"
        :pressed="tags.includes(t)"
        :icon="tags.includes(t) ? 'pi-check' : 'pi-tag'"
        :count="n"
        @click="flip(t)"
      >{{ t }}</ChipToggle>
      <ChipToggle disabled>Full</ChipToggle>
    </div>
  </div>
</template>
