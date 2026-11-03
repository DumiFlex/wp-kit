<script setup lang="ts">
/** Fixed values as a searchable variable → value → negative table, paged so
 *  a long list stays short until asked. */
import { computed, ref } from "vue";
import TokenizedValue from "./TokenizedValue.vue";
import { fixedValues, scanText, type FixedValue, type Obj } from "./preview-readers";
import SearchInput from "./SearchInput.vue";
import Button from "./Button.vue";
import Chip from "./Chip.vue";

const props = defineProps<{
  inner: Obj | null;
  refMap: ReadonlyMap<string, string>;
}>();

const PAGE = 10;
const LONG_CHARS = 110;

const rows = computed(() => fixedValues(props.inner));
const negCount = computed(() => rows.value.filter((r) => r.negative).length);
const refCount = computed(
  () =>
    rows.value.filter((r) => {
      const s = scanText(r.value);
      return s.refs || s.picks;
    }).length,
);

const search = ref("");
const onlyNeg = ref(false);
const filtering = computed(() => search.value.trim() !== "" || onlyNeg.value);
const visible = computed<FixedValue[]>(() => {
  const q = search.value.trim().toLowerCase();
  return rows.value.filter(
    (r) =>
      (!onlyNeg.value || r.negative) &&
      (!q ||
        r.name.toLowerCase().includes(q) ||
        r.value.toLowerCase().includes(q) ||
        r.negative.toLowerCase().includes(q)),
  );
});
const showAll = ref(false);
const shown = computed(() =>
  showAll.value || filtering.value ? visible.value : visible.value.slice(0, PAGE),
);
const expanded = ref(new Set<number>());
function toggle(i: number): void {
  const next = new Set(expanded.value);
  if (next.has(i)) next.delete(i);
  else next.add(i);
  expanded.value = next;
}
</script>

<template>
  <div class="wp-pv">
    <div class="wp-pv-stats">
      <div class="wp-pv-stat">
        <b>{{ rows.length }}</b><span>variable{{ rows.length === 1 ? "" : "s" }}</span>
      </div>
      <div
        v-if="negCount"
        class="wp-pv-stat"
      >
        <b>{{ negCount }}</b><span>with a negative</span>
      </div>
      <div
        v-if="refCount"
        class="wp-pv-stat"
      >
        <b>{{ refCount }}</b><span>use picks / @refs</span>
      </div>
    </div>
    <div
      v-if="rows.length > 6 || negCount"
      class="wp-pv-tool"
    >
      <SearchInput
        v-if="rows.length > 6"
        v-model="search"
        :placeholder="`Filter ${rows.length} values…`"
        data-test="fixed-search"
        class="wp-pv-search"
      />
      <Chip
        v-if="negCount"
        size="sm"
        color="var(--wp-danger)"
        :pressed="onlyNeg"
        @click="onlyNeg = !onlyNeg"
      >Has negative</Chip>
      <span
        v-if="filtering"
        class="wp-pv-count"
      >{{ visible.length }} of {{ rows.length }}</span>
    </div>
    <table class="wp-pv-table">
      <colgroup>
        <col class="wp-pv-col-n">
        <col style="width: 150px">
        <col>
        <col
          v-if="negCount"
          style="width: 28%"
        >
      </colgroup>
      <thead>
        <tr>
          <th />
          <th>Variable</th>
          <th>Value</th>
          <th v-if="negCount">
            Negative
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(r, i) in shown"
          :key="i"
          data-test="fixed-row"
        >
          <td class="wp-pv-n">
            {{ i + 1 }}
          </td>
          <td class="wp-pv-var">
            ${{ r.name }}
          </td>
          <td>
            <div :class="{ 'wp-pv-clamp': r.value.length > LONG_CHARS && !expanded.has(i) }">
              <TokenizedValue
                :value="r.value"
                :uuid-to-name="refMap"
              />
            </div>
            <Button
              v-if="r.value.length > LONG_CHARS"
              variant="link"
              size="sm"
              @click="toggle(i)"
            >{{ expanded.has(i) ? "Show less" : "Show all" }}</Button>
          </td>
          <td
            v-if="negCount"
            class="wp-pv-neg-cell"
          >
            <span
              v-if="r.negative"
              data-test="fixed-negative"
            >
              <span class="wp-pv-negtag">NEG</span>
              <TokenizedValue
                :value="r.negative"
                :uuid-to-name="refMap"
              />
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <p
      v-if="!visible.length"
      class="wp-pv-empty"
    >
      No values match.
    </p>
    <div
      v-if="!filtering && visible.length > PAGE"
      class="wp-pv-more"
    >
      <Button
        variant="link"
        size="sm"
        data-test="fixed-more"
        @click="showAll = !showAll"
      >
        {{ showAll ? "Show fewer" : `Show ${visible.length - PAGE} more` }}
      </Button>
    </div>
  </div>
</template>

<style scoped src="./preview.css"></style>
