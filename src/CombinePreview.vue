<script setup lang="ts">
/** Combine: the template in its own block, its negative under it, and a
 *  list of the variables it reads with where each one is used. */
import { computed, ref } from "vue";
import TokenizedValue from "./TokenizedValue.vue";
import Button from "./Button.vue";
import { readString, readStrings, scanText, type Obj } from "./preview-readers";

const props = defineProps<{
  inner: Obj | null;
  refMap: ReadonlyMap<string, string>;
}>();

const PAGE = 6;

const template = computed(() => readString(props.inner, "template") ?? "");
const negative = computed(() => readString(props.inner, "negative") ?? "");
const output = computed(() => readString(props.inner, "output_var"));
const tplScan = computed(() => scanText(template.value));
const negScan = computed(() => scanText(negative.value));

interface InputRow {
  name: string;
  where: string;
}
const inputs = computed<InputRow[]>(() => {
  const names = [
    ...new Set([
      ...readStrings(props.inner, "input_vars"),
      ...tplScan.value.vars,
      ...negScan.value.vars,
      ...negScan.value.negVars,
    ]),
  ];
  return names.map((name) => {
    const where: string[] = [];
    if (tplScan.value.vars.includes(name)) where.push("template");
    if (negScan.value.vars.includes(name)) where.push("negative");
    if (negScan.value.negVars.includes(name) || tplScan.value.negVars.includes(name))
      where.push("negative (.neg)");
    return { name, where: where.join(", ") || "declared, not used" };
  });
});
const showAll = ref(false);
const shown = computed(() => (showAll.value ? inputs.value : inputs.value.slice(0, PAGE)));
</script>

<template>
  <div class="wp-pv">
    <div class="wp-pv-stats">
      <div class="wp-pv-stat">
        <b>{{ inputs.length }}</b><span>input{{ inputs.length === 1 ? "" : "s" }}</span>
      </div>
      <div
        v-if="tplScan.picks"
        class="wp-pv-stat"
      >
        <b>{{ tplScan.picks }}</b><span>inline pick{{ tplScan.picks === 1 ? "" : "s" }}</span>
      </div>
      <div class="wp-pv-stat">
        <b>{{ negative ? "yes" : "no" }}</b><span>negative</span>
      </div>
    </div>
    <div class="wp-pv-sec">
      Template<template v-if="output">
        → <span class="wp-cb__out">${{ output }}</span>
      </template>
    </div>
    <div
      class="wp-pv-block wp-combine__template"
      data-test="combine-template"
    >
      <TokenizedValue
        :value="template"
        :uuid-to-name="refMap"
      />
    </div>
    <template v-if="negative">
      <div class="wp-pv-sec wp-cb__neglabel">
        Negative
      </div>
      <div
        class="wp-pv-block wp-pv-block--neg"
        data-test="combine-negative"
      >
        <TokenizedValue
          :value="negative"
          :uuid-to-name="refMap"
        />
      </div>
    </template>
    <template v-if="inputs.length">
      <div class="wp-pv-sec">
        Inputs
      </div>
      <table class="wp-pv-table">
        <colgroup>
          <col style="width: 180px">
          <col>
        </colgroup>
        <tbody>
          <tr
            v-for="i in shown"
            :key="i.name"
            data-test="combine-input"
          >
            <td class="wp-pv-var">
              ${{ i.name }}
            </td>
            <td :class="{ 'wp-cb__unused': i.where === 'declared, not used' }">
              {{ i.where }}
            </td>
          </tr>
        </tbody>
      </table>
      <div
        v-if="inputs.length > PAGE"
        class="wp-pv-more"
      >
        <Button
          variant="link"
          size="sm"
          @click="showAll = !showAll"
        >
          {{ showAll ? "Show fewer" : `Show ${inputs.length - PAGE} more` }}
        </Button>
      </div>
    </template>
    <div class="wp-cb__pad" />
  </div>
</template>

<style scoped src="./preview.css"></style>
<style scoped>
.wp-cb__out {
  font-family: var(--wp-font-mono);
  color: var(--wp-success);
  text-transform: none;
  letter-spacing: 0;
}
.wp-cb__neglabel {
  color: var(--wp-danger-text, var(--wp-danger));
}
.wp-cb__unused {
  color: var(--wp-text-dim);
}
.wp-cb__pad {
  height: 6px;
}
</style>
