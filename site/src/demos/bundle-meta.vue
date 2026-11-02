<script setup lang="ts">
import BundleMeta from "@kit/BundleMeta.vue";
</script>

<template>
  <div class="wp-kit__stack">
    <BundleMeta :count="3" :names="['palette', 'mood', 'style']" />
    <BundleMeta :count="1" />
  </div>
</template>
