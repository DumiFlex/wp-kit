<script setup lang="ts">
/**
 * The NSFW and Featured badges on a post: a danger Chip and a warn Chip
 * with a star, so they have a Chip's height and type. Renders nothing for a
 * safe, unfeatured post.
 *
 *   <RatingBadge rating="nsfw" featured />
 */
import Chip from "./Chip.vue";

defineProps<{
  rating?: "sfw" | "nsfw" | undefined;
  featured?: boolean | undefined;
}>();
</script>

<template>
  <Chip v-if="rating === 'nsfw'" tone="danger" data-rating="nsfw">NSFW</Chip>
  <Chip v-if="featured" tone="warn" icon="star-fill" data-rating="featured">Featured</Chip>
</template>
