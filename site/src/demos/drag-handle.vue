<script setup lang="ts">
import DragHandle from "@kit/DragHandle.vue";
</script>

<template>
  <div class="wp-kit__stack">
    <div class="wp-kit__row" style="gap: 8px; align-items: center">
      <DragHandle /><span>Hair colour</span>
    </div>
    <div class="wp-kit__row" style="gap: 8px; align-items: center">
      <DragHandle size="md" /><span>Style lock (a manager row)</span>
    </div>
  </div>
</template>
