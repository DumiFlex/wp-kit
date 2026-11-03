<script setup lang="ts">
/**
 * Derivation as rule cards: what it reads / writes / sends to negatives,
 * then per rule IF / ELSE IF / ELSE with nested AND / OR groups and every
 * action numbered (the action plus its schema v8 `extra_actions`).
 */
import { computed, ref } from "vue";
import TokenizedValue from "./TokenizedValue.vue";
import DerivationCondition from "./DerivationCondition.vue";
import Disclosure from "./Disclosure.vue";
import {
  derivationRules,
  varFlow,
  type ActionOp,
  type DerivationRule,
  type Obj,
} from "./preview-readers";

const props = defineProps<{
  /** The whole module row (the var summary reads it). */
  payload: Obj | null;
  inner: Obj | null;
  refMap: ReadonlyMap<string, string>;
}>();

const OPEN_RULES = 3;

const rules = computed(() => derivationRules(props.inner));
const flow = computed(() => varFlow(props.payload));
const branchCount = computed(() =>
  rules.value.reduce((n, r) => n + r.branches.length + (r.fallback ? 1 : 0), 0),
);

const OP_LABEL: Record<ActionOp, string> = {
  set: "SET",
  append: "APPEND",
  prepend: "PREPEND",
  neg_add: "+ NEGATIVE",
  neg_replace: "REPLACE NEG",
  other: "",
};
function opLabel(op: ActionOp, mode: string): string {
  return OP_LABEL[op] || mode.toUpperCase();
}
function ruleSummary(r: DerivationRule): string {
  const n = r.branches.length;
  const parts = [`${n} branch${n === 1 ? "" : "es"}${r.fallback ? " + else" : ""}`];
  const targets = [
    ...new Set(
      [...r.branches.flatMap((b) => b.actions), ...(r.fallback ?? [])]
        .filter((a) => a.op !== "neg_add" && a.op !== "neg_replace")
        .map((a) => a.target),
    ),
  ];
  if (targets.length) parts.push(`sets ${targets.join(", ")}`);
  return parts.join(" · ");
}
const toggled = ref(new Set<number>());
function isOpen(i: number): boolean {
  const byDefault = i < OPEN_RULES;
  return toggled.value.has(i) ? !byDefault : byDefault;
}
function toggle(i: number): void {
  const next = new Set(toggled.value);
  if (next.has(i)) next.delete(i);
  else next.add(i);
  toggled.value = next;
}
</script>

<template>
  <div class="wp-pv wp-derivation">
    <div class="wp-pv-stats">
      <div class="wp-pv-stat">
        <b>{{ rules.length }}</b><span>rule{{ rules.length === 1 ? "" : "s" }}</span>
      </div>
      <div class="wp-pv-stat">
        <b>{{ branchCount }}</b><span>branches</span>
      </div>
    </div>
    <div class="wp-dv-io">
      <div v-if="flow.reads.length">
        <span class="wp-pv-label">Reads</span>
        <code
          v-for="v in flow.reads"
          :key="`r-${v}`"
          class="wp-dv-var"
        >${{ v }}</code>
      </div>
      <div v-if="flow.sets.length">
        <span class="wp-pv-label">Writes</span>
        <code
          v-for="v in flow.sets"
          :key="`w-${v}`"
          class="wp-dv-var"
        >${{ v }}</code>
      </div>
      <div v-if="flow.negatives.length">
        <span class="wp-pv-label">Negatives</span>
        <code
          v-for="v in flow.negatives"
          :key="`n-${v}`"
          class="wp-dv-var wp-dv-var--neg"
        >{{ v }}</code>
      </div>
    </div>

    <div
      v-for="(r, ri) in rules"
      :key="ri"
      class="wp-dv-rule wp-derivation__rule"
    >
      <Disclosure
        flush
        lazy
        class="wp-dv-rule__fold"
        :open="isOpen(ri)"
        @update:open="toggle(ri)"
      >
        <template #summary>
          <b class="wp-dv-rule__name">Rule {{ ri + 1 }}</b><span class="wp-dv-rule__sum">{{ ruleSummary(r) }}</span>
        </template>
        <div
          v-for="(b, bi) in r.branches"
          :key="bi"
          class="wp-dv-branch wp-derivation__branch"
        >
          <span class="wp-dv-kw">{{ bi === 0 ? "IF" : "ELSE IF" }}</span>
          <div class="wp-dv-body">
            <DerivationCondition
              v-if="b.condition"
              :cond="b.condition"
            />
            <span
              v-else
              class="wp-dv-none"
            >(no condition)</span>
            <ol class="wp-dv-steps">
              <li
                v-for="(a, ai) in b.actions"
                :key="ai"
                data-test="derivation-action"
              >
                <span class="wp-dv-i">{{ ai + 1 }}</span>
                <span class="wp-dv-op-cell">
                  <span
                    class="wp-dv-op"
                    :data-op="a.op"
                  >{{ opLabel(a.op, a.mode) }}</span>
                  <code class="wp-dv-target wp-derivation__target">{{ a.target }}</code>
                </span>
                <span class="wp-dv-val"><TokenizedValue
                  :value="a.value"
                  :uuid-to-name="refMap"
                /></span>
              </li>
            </ol>
          </div>
        </div>
        <div
          v-if="r.fallback"
          class="wp-dv-branch wp-derivation__branch is-else"
        >
          <span class="wp-dv-kw wp-dv-kw--else">ELSE</span>
          <div class="wp-dv-body">
            <ol class="wp-dv-steps">
              <li
                v-for="(a, ai) in r.fallback"
                :key="ai"
                data-test="derivation-action"
              >
                <span class="wp-dv-i">{{ ai + 1 }}</span>
                <span class="wp-dv-op-cell">
                  <span
                    class="wp-dv-op"
                    :data-op="a.op"
                  >{{ opLabel(a.op, a.mode) }}</span>
                  <code class="wp-dv-target wp-derivation__target">{{ a.target }}</code>
                </span>
                <span class="wp-dv-val"><TokenizedValue
                  :value="a.value"
                  :uuid-to-name="refMap"
                /></span>
              </li>
            </ol>
          </div>
        </div>
      </Disclosure>
    </div>
    <div class="wp-dv-pad" />
  </div>
</template>

<style scoped src="./preview.css"></style>
<style scoped>
.wp-dv-io {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 24px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--wp-border);
}
.wp-dv-io > div {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.wp-dv-var {
  font-family: var(--wp-font-mono);
  font-size: 12px;
  color: var(--wp-success);
}
.wp-dv-var--neg {
  color: var(--wp-danger-text, var(--wp-danger));
  background: color-mix(in oklab, var(--wp-danger) 10%, transparent);
  border-radius: min(3px, var(--wp-radius-cap, 999px));
  padding: 0 4px;
}
.wp-dv-rule {
  margin: 14px 16px 0;
  border: 1px solid var(--wp-border);
  border-radius: min(10px, var(--wp-radius-cap, 999px));
  overflow: hidden;
}
.wp-dv-rule__name {
  font-size: 12.5px;
}
.wp-dv-rule__sum {
  min-width: 0;
  overflow: hidden;
  color: var(--wp-text-dim);
  font-size: 11.5px;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wp-dv-branch {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
}
.wp-dv-branch + .wp-dv-branch {
  border-top: 1px solid var(--wp-border);
}
.wp-dv-kw {
  padding: 12px 0 0 14px;
  font-family: var(--wp-font-mono);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--wp-accent-text);
}
.wp-dv-kw--else {
  color: var(--wp-text-dim);
}
.wp-dv-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px 12px 0;
  min-width: 0;
}
.wp-dv-none {
  font-size: 12px;
  color: var(--wp-text-dim);
}
.wp-dv-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wp-dv-steps li {
  display: grid;
  grid-template-columns: 18px minmax(120px, max-content) minmax(0, 1fr);
  align-items: baseline;
  gap: 8px;
}
.wp-dv-i {
  font-family: var(--wp-font-mono);
  font-size: 11px;
  color: var(--wp-text-dim);
  text-align: right;
}
.wp-dv-op-cell {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
}
.wp-dv-op {
  font-family: var(--wp-font-mono);
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: min(5px, var(--wp-radius-cap, 999px));
  background: var(--wp-bg-3);
  color: var(--wp-text-muted);
}
.wp-dv-op[data-op="set"] {
  background: color-mix(in oklab, var(--wp-success) 14%, transparent);
  color: var(--wp-success);
}
.wp-dv-op[data-op="append"],
.wp-dv-op[data-op="prepend"] {
  background: color-mix(in oklab, var(--wp-info) 16%, transparent);
  color: color-mix(in oklab, var(--wp-info) 55%, white);
}
.wp-dv-op[data-op="neg_add"],
.wp-dv-op[data-op="neg_replace"] {
  background: color-mix(in oklab, var(--wp-danger) 16%, transparent);
  color: var(--wp-danger-text, var(--wp-danger));
}
.wp-dv-target {
  font-family: var(--wp-font-mono);
  font-size: 12px;
  color: var(--wp-success);
}
.wp-dv-val {
  font-family: var(--wp-font-mono);
  font-size: 12px;
  line-height: 1.6;
  padding: 3px 9px;
  border-radius: min(5px, var(--wp-radius-cap, 999px));
  background: var(--wp-bg-3);
  color: var(--wp-text);
  overflow-wrap: anywhere;
  min-width: 0;
}
.wp-dv-pad {
  height: 14px;
}
@container (max-width: 640px) {
  .wp-dv-steps li {
    grid-template-columns: 18px minmax(0, 1fr);
  }
  .wp-dv-val {
    grid-column: 2;
  }
}
</style>
