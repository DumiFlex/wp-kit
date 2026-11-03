<script setup lang="ts">
import { ref } from "vue";
import Checkbox from "@kit/Checkbox.vue";
import WpSwitch from "@kit/WpSwitch.vue";
import { vToggleRow } from "@kit/toggle-row";

const seed = ref(true);
const invert = ref(false);
const both = ref(false);
</script>

<template>
  <div style="display: grid; gap: 8px; width: 280px">
    <div v-toggle-row style="display: flex; align-items: center; justify-content: space-between; gap: 8px">
      <span>Override base seed (click the words)</span>
      <WpSwitch v-model="seed" aria-label="Override base seed" />
    </div>
    <span v-toggle-row class="wp-kit__inline">
      <Checkbox v-model="invert" size="sm" aria-label="Invert" />
      <span>Invert: bypass while on</span>
    </span>
    <div v-toggle-row style="display: flex; align-items: center; gap: 8px">
      <span>Two switches: the words do nothing</span>
      <WpSwitch v-model="both" aria-label="Manager" />
      <WpSwitch aria-label="Canvas" />
    </div>
  </div>
</template>
