<script setup lang="ts">
import { ref } from "vue";
import IconPicker from "@kit/IconPicker.vue";

const pickedIcon = ref<string | null>("user");
const noIcon = ref<string | null>(null);
const noteIcon = ref<string | null>("lightbulb");
const inserted = ref<string | null>(null);
</script>

<template>
  <div class="wp-kit__stack">
    <div class="wp-kit__row">
      <IconPicker v-model="pickedIcon" aria-label="Category icon" />
      <IconPicker v-model="noIcon" aria-label="Empty category icon" />
      <IconPicker v-model="pickedIcon" compact aria-label="Compact category icon" />
    </div>
    <p class="wp-kit__caption">all: every PrimeIcons glyph with a search box, tinted by color</p>
    <div class="wp-kit__row">
      <IconPicker v-model="noteIcon" all color="var(--wp-warn)" aria-label="Note icon" />
    </div>
    <p class="wp-kit__caption">inline: the list itself (an editor panel); no "No icon" here</p>
    <IconPicker v-model="inserted" all inline :allow-none="false" aria-label="Insert an icon" />
    <p class="wp-kit__caption">Picked: {{ inserted ?? "nothing yet" }}</p>
  </div>
</template>
