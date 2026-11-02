<script setup lang="ts">
import { ref } from "vue";
import Checkbox from "@kit/Checkbox.vue";
import KitLooks from "../KitLooks.vue";

const picked = ref(true);
const unpicked = ref(false);
const row = ref(true);
const tinted = ref(true);
const favorites = ref(false);
</script>

<template>
  <KitLooks v-slot="{ size }">
    <Checkbox v-model="picked" :size="size" label="Include in bundle" />
    <Checkbox v-model="unpicked" :size="size" label="Hide from prompt" />
    <Checkbox :model-value="false" indeterminate :size="size" label="Some selected" />
    <Checkbox :model-value="true" disabled :size="size" label="Disabled, ticked" />
    <Checkbox :model-value="false" disabled :size="size" label="Disabled" />
    <span class="wp-kit__inline">
      <Checkbox v-model="row" :size="size" aria-label="Row enabled" />
      <Checkbox v-model="tinted" :size="size" style="--check-on: var(--wp-danger)" aria-label="Tinted with --check-on" />
      Box only (and tinted)
    </span>
    <div style="width: 220px">
      <Checkbox v-model="favorites" field :size="size" label="Favorites only" />
    </div>
  </KitLooks>
</template>
