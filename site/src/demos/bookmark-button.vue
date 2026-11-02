<script setup lang="ts">
import { ref } from "vue";
import BookmarkButton from "@kit/BookmarkButton.vue";

const saved = ref(true);
</script>

<template>
  <div class="wp-kit__row">
    <BookmarkButton :bookmarked="saved" @toggle="saved = !saved" />
    <BookmarkButton :bookmarked="false" disabled />
  </div>
</template>
