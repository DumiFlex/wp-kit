<script setup lang="ts">
import { ref } from "vue";
import Button from "@kit/Button.vue";
import Checkbox from "@kit/Checkbox.vue";
import Popover from "@kit/Popover.vue";

const open = ref(false);
const card = ref(false);
const kinds = ref({ wildcard: true, fixed: true, derivation: false });
</script>

<template>
  <Popover v-model:open="open" label="Filter by kind">
    <template #trigger="{ props }">
      <Button v-bind="props" icon="pi-filter">Filter</Button>
    </template>
    <div class="wp-kit__menu-col">
      <Checkbox v-model="kinds.wildcard" label="Wildcards" />
      <Checkbox v-model="kinds.fixed" label="Fixed values" />
      <Checkbox v-model="kinds.derivation" label="Derivations" />
    </div>
  </Popover>
  <Popover v-model:open="card" trigger="hover" label="Reference">
    <template #trigger="{ props }">
      <Button v-bind="props" variant="ghost" icon="pi-sparkles">@{3f9a1c2e}</Button>
    </template>
    <p class="wp-kit__menu-col">Hair colour: a wildcard with 12 options. Hover card: it opens on hover or focus and stays open while the pointer is on it.</p>
  </Popover>
</template>
