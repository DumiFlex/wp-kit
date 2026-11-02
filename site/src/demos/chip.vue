<script setup lang="ts">
import Chip from "@kit/Chip.vue";
import { kindColour, type ItemType } from "@kit/kind-colour";

const TYPES: ItemType[] = ["wildcard", "fixed_values", "combine", "constraint", "derivation", "bundle"];
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
    <p class="wp-kit__muted">Pressable: as="button" (or a link) for a chip that takes you somewhere.</p>
    <div class="wp-kit__row">
      <Chip as="button" icon="tag">portrait</Chip>
      <Chip as="button" tone="accent" icon="folder">Characters</Chip>
    </div>
  </div>
</template>
