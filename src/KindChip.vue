<script setup lang="ts">
/**
 * The module-type chip: `wildcard`, `fixed_values`, `combine`, `constraint`,
 * `derivation` or `bundle`, in the kind colour the extension uses for that
 * type everywhere (`--wp-kind-*`; bundles are slate, `--wp-bundle-default`).
 * It is a Chip with that colour, so it has a Chip's height and type.
 *
 *   <KindChip kind="module" subtype="wildcard" />
 *   <KindChip kind="bundle" />
 *
 * A module with no subtype reads as `fixed_values`, the oldest type.
 */
import { computed } from "vue";
import Chip from "./Chip.vue";

export type KindChipSubtype = "fixed_values" | "combine" | "wildcard" | "constraint" | "derivation";

const props = defineProps<{
  kind: "module" | "bundle";
  /** A `"bundle"` subtype reads as a bundle too (some APIs report it so). */
  subtype?: KindChipSubtype | "bundle" | null | undefined;
}>();

const COLOURS: Record<KindChipSubtype | "bundle", string> = {
  fixed_values: "var(--wp-kind-fixed)",
  combine: "var(--wp-kind-combine)",
  wildcard: "var(--wp-kind-wildcard)",
  constraint: "var(--wp-kind-constraint)",
  derivation: "var(--wp-kind-derivation)",
  bundle: "var(--wp-bundle-default)",
};

const type = computed(() => (props.kind === "bundle" ? "bundle" : (props.subtype ?? "fixed_values")));
</script>

<template>
  <Chip :color="COLOURS[type]" :data-type="type">{{ type }}</Chip>
</template>
