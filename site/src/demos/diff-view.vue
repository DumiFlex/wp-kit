<script setup lang="ts">
import DiffView from "@kit/DiffView.vue";

const before = `{
  "name": "Hair colour",
  "options": ["auburn", "black"],
  "weight": 1
}`;
const after = `{
  "name": "Hair colour",
  "options": ["auburn", "silver", "teal"],
  "weight": 1.2
}`;
const tagsBefore = "masterpiece, blue eyes, ((silver hair)), Blue Eyes, signature watermark";
const tagsAfter = "masterpiece, blue eyes, (silver hair:1.21)";
const marks = [
  { start: 13, end: 22, label: "kept: Blue Eyes repeats it" },
  { start: 62, end: 71, label: "blocklist entry", tone: "warn" as const },
];
</script>

<template>
  <div class="wp-kit__stack wp-kit__stack--wide">
    <DiffView before="auburn hair, soft rim light, looking away" after="silver hair, soft rim light, looking at viewer" />
    <DiffView :before="tagsBefore" :after="tagsAfter" by="tags" :marks="marks" />
    <DiffView :before="before" :after="after" by="lines" layout="split" mono />
    <DiffView before="same text" after="same text" size="sm" />
  </div>
</template>
