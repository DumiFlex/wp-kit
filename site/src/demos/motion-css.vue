<script setup lang="ts">
import { ref } from "vue";
import Button from "@kit/Button.vue";

// Bumping the key remounts the element, so its entrance plays again.
const n = ref(0);
</script>

<template>
  <div class="wp-kit__stack wp-kit__stack--wide">
    <div class="wp-kit__row">
      <Button size="sm" icon="pi-replay" data-test="motion-css-replay" @click="n++">Play again</Button>
    </div>
    <div :key="n" class="wp-kit__row">
      <span class="wp-kit__inline wp-enter-fade">Fade</span>
      <span class="wp-chip wp-enter-pop">👍 Pop</span>
      <span class="wp-chip wp-enter-rise">Rise</span>
      <span class="wp-chip wp-enter-rise" data-from="below">Rise from below</span>
      <span class="wp-chip wp-enter-drop wp-attention">Drop + attention</span>
    </div>
  </div>
</template>
