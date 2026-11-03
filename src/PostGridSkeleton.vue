<script setup lang="ts">
/**
 * The shape of a post grid while its first page loads: card-sized blocks of
 * mixed heights in the same masonry columns PostCard grids use (340px
 * columns, one column on phones). Used by every post grid (browse, bundles,
 * profiles, libraries, the embed).
 *
 *   <PostGridSkeleton v-if="loading" :count="6" />
 *
 * `label` is what screen readers hear once; pass `""` when the grid sits
 * inside another skeleton that already says it (ProfileSkeleton does).
 */
import Skeleton from "./Skeleton.vue";

withDefaults(defineProps<{
  /** How many cards to draw. */
  count?: number | undefined;
  /** What screen readers hear. */
  label?: string | undefined;
}>(), { count: 6, label: "Loading posts" });

const HEIGHTS = ["180px", "240px", "200px", "240px", "180px", "200px"];
</script>

<template>
  <div class="wp-post-grid-skeleton" data-testid="post-grid-skeleton">
    <Skeleton
      v-for="i in count"
      :key="i"
      class="wp-post-grid-skeleton__card"
      shape="block"
      :height="HEIGHTS[(i - 1) % HEIGHTS.length]"
      :label="i === 1 && label ? label : undefined"
    />
  </div>
</template>

<style scoped>
.wp-post-grid-skeleton {
  column-width: 340px;
  column-gap: 20px;
}
.wp-post-grid-skeleton__card {
  margin-bottom: 20px;
  break-inside: avoid;
}
@media (max-width: 1200px) {
  .wp-post-grid-skeleton {
    column-width: 320px;
  }
}
@media (max-width: 560px) {
  .wp-post-grid-skeleton {
    column-width: auto;
    column-count: 1;
  }
  .wp-post-grid-skeleton__card {
    margin-bottom: 14px;
  }
}
</style>
