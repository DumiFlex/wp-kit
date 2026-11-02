<script setup lang="ts">
import { ref } from "vue";
import ColorField from "@kit/ColorField.vue";

const text = ref("#ffffff");
const band = ref("#00000099");
const none = ref("none");
const category = ref("#60a5fa");
const frame = ref("#6366f1");
</script>

<template>
  <div class="wp-kit__stack">
    <div class="wp-kit__row">
      <ColorField v-model="text" aria-label="Text colour" />
      <ColorField v-model="band" alpha allow-none aria-label="Label band" />
      <ColorField v-model="none" alpha allow-none size="md" aria-label="Strip colour" />
    </div>
    <p class="wp-kit__muted">With presets (a category or bundle colour), and compact for a name row.</p>
    <div class="wp-kit__row">
      <ColorField v-model="category" presets size="md" aria-label="Category colour" />
      <ColorField v-model="frame" presets compact size="md" aria-label="Bundle frame colour" />
    </div>
  </div>
</template>
