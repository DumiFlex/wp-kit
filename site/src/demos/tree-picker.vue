<script setup lang="ts">
import { ref } from "vue";
import TreePicker from "@kit/TreePicker.vue";
import type { TreePickerNode } from "@kit/tree-picker";

const tree: TreePickerNode[] = [
  { id: "style", label: "Style" },
  { id: "nsfw", label: "NSFW" },
  { id: "utility", label: "Utility" },
  {
    id: "character", label: "Character", children: [
      { id: "hair", label: "Hair", children: [{ id: "hair-colour", label: "Colour" }, { id: "hair-style", label: "Style" }] },
      { id: "eyes", label: "Eyes" },
      { id: "outfit", label: "Outfit" },
      { id: "pose", label: "Pose" },
    ],
  },
  {
    id: "scene", label: "Scene", children: [
      { id: "lighting", label: "Lighting" },
      { id: "weather", label: "Weather" },
      { id: "location", label: "Location" },
    ],
  },
  {
    id: "camera", label: "Camera", children: [
      { id: "angle", label: "Angle" },
      { id: "lens", label: "Lens" },
    ],
  },
];

const picked = ref<string[]>(["hair-colour", "lighting"]);
</script>

<template>
  <div class="wp-kit__stack wp-kit__stack--wide">
    <TreePicker v-model="picked" :items="tree" :max="5" noun="categories" />
  </div>
</template>
