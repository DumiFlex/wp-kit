<script setup lang="ts">
import { ref } from "vue";
import StarButton from "@kit/StarButton.vue";

const starred = ref(false);
const count = ref(41);
function toggle(): void {
  starred.value = !starred.value;
  count.value += starred.value ? 1 : -1;
}
</script>

<template>
  <div class="wp-kit__row">
    <StarButton :starred="starred" :count="count" @toggle="toggle" />
    <StarButton :starred="false" :count="3" disabled />
  </div>
</template>
