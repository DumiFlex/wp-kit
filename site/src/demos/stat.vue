<script setup lang="ts">
import Stat from "@kit/Stat.vue";
</script>

<template>
  <div class="wp-kit__stack wp-kit__stack--wide">
    <p class="wp-kit__caption">Tiles</p>
    <div class="wp-kit-stat-grid">
      <Stat label="Wildcards" :value="128" icon="pi-sparkles" delta="edited 2h ago" />
      <Stat label="Downloads" :value="12045" icon="pi-download" delta="+312 this week" as="button" />
      <Stat label="Open reports" :value="3" icon="pi-flag" tone="warn" delta="oldest 2 days" />
      <Stat label="Banned" :value="0" icon="pi-ban" tone="danger" loading />
    </div>
    <p class="wp-kit__caption">Small tiles (a drawer)</p>
    <div class="wp-kit-stat-grid wp-kit-stat-grid--three">
      <Stat size="sm" label="posts" :value="14" />
      <Stat size="sm" label="stars given" :value="208" />
      <Stat size="sm" label="reports filed" :value="1" />
    </div>
    <p class="wp-kit__caption">Rows (a summary)</p>
    <div class="wp-kit-stat-rows">
      <Stat variant="row" label="Stars" :value="342" />
      <Stat variant="row" label="Downloads" :value="12045" />
      <Stat variant="row" label="Latest" value="v7" />
      <Stat variant="row" label="Updated" value="3 days ago" />
    </div>
    <div class="wp-kit__canvas">
      <p class="wp-kit__caption">Canvas</p>
      <div class="wp-kit-stat-grid wp-kit-stat-grid--three">
        <Stat size="sm" label="options" :value="24" />
        <Stat size="sm" label="rolled" :value="1200" icon="pi-refresh" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.wp-kit-stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; width: 100%; }
.wp-kit-stat-grid--three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.wp-kit-stat-rows { display: flex; flex-direction: column; width: 100%; max-width: 280px; }
</style>
