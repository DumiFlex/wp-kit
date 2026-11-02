<script setup lang="ts">
import PostCard, { type PostCardData } from "@kit/PostCard.vue";

const day = 86_400_000;
const cards: PostCardData[] = [
  {
    slug: "dumi/warm-palette", kind: "module", subtype: "wildcard", stars: 42, downloads: 1280,
    updatedAt: new Date(Date.now() - 2 * day).toISOString(), recommended: true, version: 3,
    description: "Warm sunset colours, weighted toward amber and rose.", tags: ["palette", "warm", "sunset", "colour", "film"],
  },
  {
    slug: "aspen/sunset-kit", kind: "bundle", stars: 7, downloads: 96, featured: true, version: 2,
    updatedAt: new Date(Date.now() - 40 * day).toISOString(),
    bundleModules: { count: 3, names: ["palette", "mood", "style"] }, description: "Everything for a sunset scene.",
  },
  {
    slug: "kestrel/old-rules", kind: "module", subtype: "constraint", stars: 0, downloads: 3, rating: "nsfw", deleted: true,
    updatedAt: new Date(Date.now() - 400 * day).toISOString(),
  },
];
</script>

<template>
  <div class="wp-kit__grid">
    <PostCard v-for="(c, i) in cards" :key="c.slug" :post="c" :starred="i === 0" href="#post-card" />
  </div>
</template>
