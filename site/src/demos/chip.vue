<script setup lang="ts">
import { ref } from "vue";
import Chip from "@kit/Chip.vue";
import { kindColour, type ItemType } from "@kit/kind-colour";

const TYPES: ItemType[] = ["wildcard", "fixed_values", "combine", "constraint", "derivation", "bundle"];
const kind = ref<ItemType | "all">("all");
const tags = ref<string[]>(["portrait"]);
const ROLES = [
  { id: "subject", label: "Subjects", n: 24, color: "var(--wp-kind-wildcard)" },
  { id: "style", label: "Styles", n: 9, color: "var(--wp-kind-combine)" },
  { id: "list", label: "Lists", n: 131, color: "var(--wp-kind-fixed)" },
];
const roles = ref<string[]>(["subject"]);
function flipRole(r: string): void {
  roles.value = roles.value.includes(r) ? roles.value.filter((x) => x !== r) : [...roles.value, r];
}
function flip(t: string): void {
  tags.value = tags.value.includes(t) ? tags.value.filter((x) => x !== t) : [...tags.value, t];
}
</script>

<template>
  <div class="wp-kit__stack wp-kit__stack--wide">
    <div class="wp-kit__row">
      <Chip>portrait</Chip>
      <Chip tone="accent">$mood</Chip>
      <Chip tone="success" icon="pi-check">Rules held</Chip>
      <Chip tone="warn" icon="pi-exclamation-triangle">2 conflicts</Chip>
      <Chip tone="danger">missing $subject</Chip>
      <Chip tone="info">v10</Chip>
      <Chip color="var(--wp-kind-combine)">Combine</Chip>
    </div>
    <p class="wp-kit__muted">Category pills: color + icon (what CategoryChip was).</p>
    <div class="wp-kit__row">
      <Chip color="#60a5fa" icon="user">Characters</Chip>
      <Chip color="#f472b6" icon="star">Styles</Chip>
      <Chip :color="null" icon="folder">No colour</Chip>
    </div>
    <p class="wp-kit__muted">A module type: color from kindColour(). A post's rating: a tone, with an icon for Featured.</p>
    <div class="wp-kit__row">
      <Chip v-for="t in TYPES" :key="t" :color="kindColour(t)">{{ t }}</Chip>
      <Chip tone="danger">NSFW</Chip>
      <Chip tone="warn" icon="star-fill">Featured</Chip>
    </div>
    <p class="wp-kit__muted">Removable: a plain ✕, same height as a bare chip.</p>
    <div class="wp-kit__row">
      <Chip>winter</Chip>
      <Chip removable>winter</Chip>
      <Chip tone="accent" removable>$mood</Chip>
      <Chip color="var(--wp-kind-wildcard)" removable>Wildcard</Chip>
    </div>
    <p class="wp-kit__muted">A status dot.</p>
    <div class="wp-kit__row">
      <Chip tone="success" dot>recommended</Chip>
      <Chip tone="danger" dot>broken</Chip>
    </div>
    <p class="wp-kit__muted">Filters: pressed (true or false) makes a toggle; size="sm" lines up with fields, count adds a number.</p>
    <div class="wp-kit__row">
      <Chip :pressed="kind === 'all'" size="sm" icon="pi-th-large" @click="kind = 'all'">All</Chip>
      <Chip
        v-for="t in TYPES.slice(0, 3)"
        :key="t"
        :pressed="kind === t"
        :color="kindColour(t)"
        size="sm"
        icon="pi-circle-fill"
        @click="kind = t"
      >{{ t }}</Chip>
    </div>
    <div class="wp-kit__row">
      <Chip
        v-for="(n, t) in { portrait: 12, noir: 4, watercolor: 31 }"
        :key="t"
        :pressed="tags.includes(t)"
        :icon="tags.includes(t) ? 'pi-check' : 'pi-tag'"
        :count="n"
        size="sm"
        @click="flip(t)"
      >{{ t }}</Chip>
      <Chip :pressed="false" size="sm" disabled>Full</Chip>
    </div>
    <p class="wp-kit__muted">Pressable: as="button" (or a link) for a chip that takes you somewhere.</p>
    <div class="wp-kit__row">
      <Chip as="button" icon="tag">portrait</Chip>
      <Chip as="button" tone="accent" icon="folder">Characters</Chip>
    </div>
    <p class="wp-kit__muted">variant="stat": a tile with the count big on top and a top edge in its colour; with pressed it filters too.</p>
    <div class="wp-kit__row">
      <Chip
        v-for="r in ROLES"
        :key="r.id"
        variant="stat"
        :color="r.color"
        :count="r.n"
        :pressed="roles.includes(r.id)"
        @click="flipRole(r.id)"
      >{{ r.label }}</Chip>
      <Chip variant="stat" count="98%">Carries over</Chip>
    </div>
  </div>
</template>
