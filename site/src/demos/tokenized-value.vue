<script setup lang="ts">
import TokenizedValue from "@kit/TokenizedValue.vue";

const names = new Map([["1a2b3c4d", "outfit"]]);
</script>

<template>
  <div class="wp-kit__stack">
    <TokenizedValue value="a {calm|fierce|regal} $mood knight in @{1a2b3c4d}" :uuid-to-name="names" />
    <TokenizedValue value="{2$$, $$red|green|blue} with $mood.neg and @{deadbeef}" />
    <TokenizedValue value="plain text, no grammar" />
  </div>
</template>
