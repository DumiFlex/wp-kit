<script setup lang="ts">
import KindChip from "@kit/KindChip.vue";
</script>

<template>
  <div class="wp-kit__row">
    <KindChip kind="module" subtype="wildcard" />
    <KindChip kind="module" subtype="fixed_values" />
    <KindChip kind="module" subtype="combine" />
    <KindChip kind="module" subtype="constraint" />
    <KindChip kind="module" subtype="derivation" />
    <KindChip kind="bundle" />
  </div>
</template>
