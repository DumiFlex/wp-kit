<script setup lang="ts">
import ConstraintMatrixPreview from "@kit/ConstraintMatrixPreview.vue";

const rows = ["avian", "canine", "feline"];
const cols = ["calm", "regal", "intense"];
const matrix = {
  avian: { regal: { mode: "boost", factor: 2 }, intense: { mode: "boost", factor: 1.5 } },
  canine: { calm: { mode: "reduce", factor: 0.5 }, regal: { mode: "exclude", factor: 0 } },
  feline: { calm: { mode: "boost", factor: 3 }, intense: { mode: "reduce", factor: 0.3 } },
};
const exceptions = [{ source: "feline", target: "regal", mode: "exclude", factor: 0 }];
</script>

<template>
  <ConstraintMatrixPreview
    :rows="rows"
    :cols="cols"
    :matrix="matrix"
    source-name="species"
    target-name="temperament"
    :source-groups="{}"
    :target-groups="{}"
    :exceptions="exceptions"
    target-select="next 2"
    :ref-map="new Map()"
  />
</template>
