<script setup lang="ts">
/** One derivation condition: a single test, or an ALL OF / ANY OF group
 *  drawn as a nested box (schema v7 AND / OR). */
import type { Condition } from "./preview-readers";

defineOptions({ name: "DerivationCondition" });
defineProps<{ cond: Condition }>();
</script>

<template>
  <span
    v-if="cond.kind === 'test'"
    class="wp-dv-test"
    data-test="derivation-test"
  >
    {{ cond.var }} <em>{{ cond.op.replace(/_/g, " ") }}</em>{{ cond.value !== null ? ` ${cond.value}` : "" }}
  </span>
  <div
    v-else
    class="wp-dv-group"
    :data-match="cond.match"
    data-test="derivation-group"
  >
    <span class="wp-dv-group__head">{{ cond.match === "any" ? "ANY OF" : "ALL OF" }}</span>
    <DerivationCondition
      v-for="(c, i) in cond.conditions"
      :key="i"
      :cond="c"
    />
  </div>
</template>

<style scoped>
.wp-dv-test {
  display: inline-block;
  align-self: flex-start;
  font-family: var(--wp-font-mono);
  font-size: 12px;
  padding: 2px 8px;
  border-radius: min(5px, var(--wp-radius-cap, 999px));
  background: var(--wp-bg-3);
  color: var(--wp-text);
  overflow-wrap: anywhere;
}
.wp-dv-test em {
  font-style: normal;
  color: var(--wp-text-muted);
}
.wp-dv-group {
  display: inline-flex;
  flex-direction: column;
  gap: 5px;
  max-width: 100%;
  padding: 6px 8px;
  border: 1px dashed var(--wp-border-strong);
  border-radius: min(8px, var(--wp-radius-cap, 999px));
}
.wp-dv-group__head {
  font-family: var(--wp-font-mono);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--wp-constraint-source-text);
}
.wp-dv-group[data-match="any"] > .wp-dv-group__head {
  color: var(--wp-constraint-target-text);
}
</style>
