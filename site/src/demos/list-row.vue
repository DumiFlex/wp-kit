<script setup lang="ts">
import { ref } from "vue";
import ListRow from "@kit/ListRow.vue";

const tags = ref<string[]>(["portrait"]);
function flip(t: string): void {
  tags.value = tags.value.includes(t) ? tags.value.filter((x) => x !== t) : [...tags.value, t];
}
const child = ref("mood");
const children = [
  { key: "palette", name: "Palette", icon: "pi-sparkles", color: "var(--wp-kind-wildcard)", desc: "wildcard · 12 options", on: true },
  { key: "mood", name: "Mood", icon: "pi-sparkles", color: "var(--wp-kind-wildcard)", desc: "wildcard · 8 options", on: true },
  { key: "style", name: "Style lock", icon: "pi-filter", color: "var(--wp-kind-constraint)", desc: "constraint · disabled", on: false },
];
const cat = ref("portraits");
</script>

<template>
  <div class="wp-kit__row" style="align-items: flex-start; gap: 24px; flex-wrap: wrap">
    <div data-wp-rows style="width: 180px">
      <ListRow
        v-for="(n, t) in { portrait: 12, noir: 4, watercolor: 31 }"
        :key="t"
        size="sm"
        toggle
        :selected="tags.includes(t)"
        :count="n"
        @click="flip(t)"
      >{{ t }}</ListRow>
    </div>
    <nav data-wp-rows style="width: 220px">
      <ListRow
        v-for="c in children"
        :key="c.key"
        :selected="child === c.key"
        :icon="c.icon"
        :icon-color="c.color"
        :description="c.desc"
        :muted="!c.on"
        @click="child = c.key"
      >{{ c.name }}</ListRow>
    </nav>
    <div data-wp-rows style="width: 200px">
      <ListRow :selected="cat === 'people'" icon="folder" @click="cat = 'people'">People</ListRow>
      <ListRow :selected="cat === 'portraits'" :icon="cat === 'portraits' ? 'check' : 'folder'" :depth="1" size="sm" @click="cat = 'portraits'">Portraits</ListRow>
      <ListRow :selected="cat === 'crowds'" :icon="cat === 'crowds' ? 'check' : 'folder'" :depth="1" size="sm" @click="cat = 'crowds'">Crowds</ListRow>
      <ListRow disabled icon="folder">Archived</ListRow>
    </div>
    <div style="width: 260px">
      <ListRow arrow description="needs the palette">dumi/<b>palette</b></ListRow>
    </div>
  </div>
</template>
