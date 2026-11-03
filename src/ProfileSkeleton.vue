<script setup lang="ts">
/**
 * The shape of a public profile while it loads: the head card (avatar,
 * name, meta line), optionally the stat cards, then a post grid
 * (PostGridSkeleton). Shared by the site's profile page and the embed's.
 *
 *   <ProfileSkeleton v-if="loading" stats />
 *
 * The root is a column with the page's gaps, so the parts space out like
 * the page they stand in for.
 */
import Card from "./Card.vue";
import Skeleton from "./Skeleton.vue";
import PostGridSkeleton from "./PostGridSkeleton.vue";

withDefaults(defineProps<{
  /** Draw the three stat cards under the head (the site's layout). */
  stats?: boolean | undefined;
  /** Avatar size. */
  avatar?: string | undefined;
  /** What screen readers hear. */
  label?: string | undefined;
}>(), { stats: false, avatar: "64px", label: "Loading profile" });
</script>

<template>
  <div class="wp-profile-skeleton" data-testid="profile-skeleton">
    <Card :padding="false">
      <div class="wp-profile-skeleton__head">
        <Skeleton shape="circle" :width="avatar" :label="label || undefined" />
        <div class="wp-profile-skeleton__name">
          <Skeleton width="30%" />
          <Skeleton width="20%" />
        </div>
      </div>
    </Card>
    <div v-if="stats" class="wp-profile-skeleton__stats">
      <Skeleton v-for="i in 3" :key="i" shape="block" height="72px" />
    </div>
    <PostGridSkeleton :count="3" label="" />
  </div>
</template>

<style scoped>
.wp-profile-skeleton {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.wp-profile-skeleton__head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 24px;
  align-items: center;
  padding: 32px;
}
.wp-profile-skeleton__name {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.wp-profile-skeleton__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
@media (max-width: 900px) {
  .wp-profile-skeleton__stats {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
