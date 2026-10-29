<script setup lang="ts">
import RatingBadge from "@kit/RatingBadge.vue";
</script>

<template>
  <div class="wp-kit__row">
    <RatingBadge rating="nsfw" />
    <RatingBadge featured />
    <RatingBadge rating="nsfw" featured />
  </div>
</template>
