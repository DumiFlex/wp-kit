<script setup lang="ts">
/**
 * The shape of a post page while it loads: meta line, title, description,
 * tag chips and the preview card on the left, the download button and its
 * details in the rail (the rail drops under the main column on narrow
 * screens). Shared by the site's post page and the embed's.
 *
 *   <PostDetailSkeleton v-if="loading" />
 */
import Skeleton from "./Skeleton.vue";

withDefaults(defineProps<{
  /** What screen readers hear. */
  label?: string | undefined;
}>(), { label: "Loading post" });
</script>

<template>
  <div class="wp-post-detail-skeleton" data-testid="post-detail-skeleton">
    <div class="wp-post-detail-skeleton__main">
      <div class="wp-post-detail-skeleton__head">
        <Skeleton width="30%" :label="label || undefined" />
        <Skeleton shape="block" width="55%" height="32px" />
        <Skeleton :lines="2" />
        <Skeleton shape="chip" :lines="4" />
      </div>
      <Skeleton shape="block" height="320px" />
    </div>
    <aside class="wp-post-detail-skeleton__aside">
      <Skeleton shape="block" height="40px" />
      <Skeleton :lines="4" />
    </aside>
  </div>
</template>

<style scoped>
.wp-post-detail-skeleton {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 32px;
  align-items: start;
  container-type: inline-size;
}
.wp-post-detail-skeleton__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.wp-post-detail-skeleton__head {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.wp-post-detail-skeleton__aside {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
@media (max-width: 900px) {
  .wp-post-detail-skeleton {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
