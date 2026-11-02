<script setup lang="ts">
import Button from "@kit/Button.vue";
import DropdownMenu from "@kit/DropdownMenu.vue";
import type { ContextMenuEntry } from "@kit/ContextMenu.vue";
import { computed, ref } from "vue";
import { useToast } from "@kit/useToast";

const toast = useToast();
const did = (what: string) => () => toast.push({ severity: "success", summary: what });
const items: ContextMenuEntry[] = [
  { label: "Rename", icon: "pi-pencil", onSelect: did("Renamed") },
  { label: "Duplicate", icon: "pi-copy", onSelect: did("Duplicated") },
  { label: "Move to category", icon: "pi-folder", subtitle: "Characters", onSelect: did("Moved") },
  { section: "Danger" },
  { label: "Delete", icon: "pi-trash", danger: true, onSelect: did("Deleted") },
];
// Checkable items stay open, so several tags can be ticked in a row.
const tags = ref<string[]>(["portrait"]);
const tagItems = computed<ContextMenuEntry[]>(() =>
  ["portrait", "noir", "watercolor"].map((t) => ({
    label: t,
    checked: tags.value.includes(t),
    keepOpen: true,
    onSelect: () => {
      tags.value = tags.value.includes(t) ? tags.value.filter((x) => x !== t) : [...tags.value, t];
    },
  })),
);
</script>

<template>
  <DropdownMenu :items="items" label="Hair colour actions" :header="{ icon: 'pi-th-large', label: 'Wildcard · Hair colour' }">
    <template #trigger="{ props }">
      <Button v-bind="props" variant="ghost" icon="pi-ellipsis-h" />
    </template>
  </DropdownMenu>
  <DropdownMenu :items="items" placement="bottom-end">
    <template #trigger="{ props }">
      <Button v-bind="props" icon="pi-chevron-down">More</Button>
    </template>
  </DropdownMenu>
  <DropdownMenu :items="tagItems" label="Tags">
    <template #trigger="{ props }">
      <Button v-bind="props" icon="pi-tag">Tags ({{ tags.length }})</Button>
    </template>
  </DropdownMenu>
</template>
