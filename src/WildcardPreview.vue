<script setup lang="ts">
/**
 * Wildcard preview built for big pools: a stats strip, search + filters,
 * tag facets with counts, and options as table rows (chance, tags,
 * negative) grouped by one axis at a time. Groups past the first two start
 * closed and each open group shows a page of rows behind "Show N more", so
 * a 200-option wildcard stays a screen or two tall.
 */
import { computed, ref } from "vue";
import TokenizedValue from "./TokenizedValue.vue";
import {
  scanText,
  wildcardAxes,
  wildcardOptions,
  type Obj,
  type WildcardOption,
} from "./preview-readers";
import WpSegmented, { type SegmentedOption } from "./WpSegmented.vue";
import SearchInput from "./SearchInput.vue";
import Button from "./Button.vue";
import ListRow from "./ListRow.vue";
import Chip from "./Chip.vue";
import PreviewGroup from "./PreviewGroup.vue";

const props = defineProps<{
  inner: Obj | null;
  refMap: ReadonlyMap<string, string>;
}>();

const OPEN_GROUPS = 2;
const PAGE = 8;
const LONG_CHARS = 90;
const FACET_PAGE = 6;

const options = computed(() => wildcardOptions(props.inner));
const axes = computed(() => wildcardAxes(props.inner));
const totalWeight = computed(() =>
  options.value.reduce((n, o) => n + Math.max(0, o.weight), 0),
);
const maxWeight = computed(() => Math.max(0, ...options.value.map((o) => o.weight)));
const refCount = computed(() => {
  let n = 0;
  for (const o of options.value) {
    const s = scanText(o.value);
    if (s.refs || s.picks) n++;
  }
  return n;
});
const negCount = computed(() => options.value.filter((o) => o.negative).length);
const weighted = computed(() => options.value.some((o) => o.weight !== 1));
const tagTotal = computed(() => new Set(axes.value.flatMap((a) => a.tags)).size);
const weightRange = computed(() => {
  const ws = options.value.map((o) => o.weight);
  const lo = Math.min(...ws);
  const hi = Math.max(...ws);
  return lo === hi ? null : `${fmt(lo)}–${fmt(hi)}×`;
});
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

// ─── filters ───
const search = ref("");
const onlyNeg = ref(false);
const onlyWeighted = ref(false);
const onlyRefs = ref(false);
/** Selected facet tags per axis. OR within an axis, AND across axes. */
const picked = ref<Record<string, string[]>>({});
function togglePick(axis: string, tag: string): void {
  const cur = picked.value[axis] ?? [];
  const next = cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag];
  picked.value = { ...picked.value, [axis]: next };
}
function isPicked(axis: string, tag: string): boolean {
  return (picked.value[axis] ?? []).includes(tag);
}
const pickCount = computed(() =>
  Object.values(picked.value).reduce((n, t) => n + t.length, 0),
);
const filtering = computed(
  () =>
    search.value.trim() !== "" ||
    onlyNeg.value ||
    onlyWeighted.value ||
    onlyRefs.value ||
    pickCount.value > 0,
);
function clearFilters(): void {
  search.value = "";
  onlyNeg.value = false;
  onlyWeighted.value = false;
  onlyRefs.value = false;
  picked.value = {};
}
function passes(o: WildcardOption): boolean {
  const q = search.value.trim().toLowerCase();
  if (
    q &&
    !o.value.toLowerCase().includes(q) &&
    !o.negative.toLowerCase().includes(q) &&
    !o.tags.some((t) => t.toLowerCase().includes(q))
  )
    return false;
  if (onlyNeg.value && !o.negative) return false;
  if (onlyWeighted.value && o.weight === 1) return false;
  if (onlyRefs.value) {
    const s = scanText(o.value);
    if (!s.refs && !s.picks) return false;
  }
  for (const tags of Object.values(picked.value)) {
    if (tags.length && !o.tags.some((t) => tags.includes(t))) return false;
  }
  return true;
}
const visible = computed(() => options.value.filter(passes));

// ─── facets ───
const facetOpen = ref(new Set<string>());
function facetTags(axis: { name: string; tags: string[] }): { tag: string; count: number }[] {
  return axis.tags
    .map((tag) => ({ tag, count: options.value.filter((o) => o.tags.includes(tag)).length }))
    .filter((f) => f.count > 0);
}
function shownFacets(axis: { name: string; tags: string[] }): { tag: string; count: number }[] {
  const all = facetTags(axis);
  return facetOpen.value.has(axis.name) ? all : all.slice(0, FACET_PAGE);
}
function toggleFacetMore(name: string): void {
  const next = new Set(facetOpen.value);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  facetOpen.value = next;
}
const showFacets = computed(() => axes.value.length > 0 && options.value.length >= 20);

// ─── grouping ───
const groupBy = ref<string>("");
const groupOptions = computed<SegmentedOption[]>(() => [
  ...axes.value.map((a) => ({ value: a.name, label: a.name })),
  { value: "none", label: "none" },
]);
const effectiveAxis = computed(() =>
  groupBy.value === "none" ? null : (axes.value.find((a) => a.name === groupBy.value) ?? axes.value[0] ?? null),
);
interface Group {
  name: string;
  options: WildcardOption[];
}
const groups = computed<Group[]>(() => {
  const axis = effectiveAxis.value;
  if (!axis) return visible.value.length ? [{ name: "", options: visible.value }] : [];
  const buckets = new Map<string, WildcardOption[]>();
  const untagged: WildcardOption[] = [];
  for (const o of visible.value) {
    // Each option lands ONCE: under the first of its tags this axis lists.
    const tag = axis.tags.find((t) => o.tags.includes(t));
    if (tag === undefined) untagged.push(o);
    else buckets.set(tag, [...(buckets.get(tag) ?? []), o]);
  }
  const out: Group[] = [];
  for (const tag of axis.tags) {
    const opts = buckets.get(tag);
    if (opts?.length) out.push({ name: tag, options: opts });
  }
  if (untagged.length) out.push({ name: "(untagged)", options: untagged });
  return out;
});

/** Toggled groups flip their default (open for the first few; every group
 *  opens while a filter is on). */
const toggled = ref(new Set<string>());
function flip(set: Set<string>, key: string): Set<string> {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}
function isOpen(name: string, index: number): boolean {
  if (!name) return true;
  const byDefault = filtering.value || index < OPEN_GROUPS;
  return toggled.value.has(name) ? !byDefault : byDefault;
}
const fullGroups = ref(new Set<string>());
function rowsOf(g: Group): WildcardOption[] {
  return fullGroups.value.has(g.name) ? g.options : g.options.slice(0, PAGE);
}
function share(g: Group): string {
  if (!totalWeight.value) return "";
  const w = g.options.reduce((n, o) => n + Math.max(0, o.weight), 0);
  return `${pct(w)} of draws`;
}
function pct(w: number): string {
  const p = (w / totalWeight.value) * 100;
  if (p > 0 && p < 0.1) return "<0.1%";
  return `${p < 10 ? p.toFixed(1) : p.toFixed(0)}%`;
}

// ─── rows ───
const view = ref<"list" | "chips">("list");
const VIEW_OPTIONS: SegmentedOption<"list" | "chips">[] = [
  { value: "list", label: "List" },
  { value: "chips", label: "Chips" },
];
const expanded = ref(new Set<string>());
function isLong(o: WildcardOption): boolean {
  return o.value.length > LONG_CHARS;
}
</script>

<template>
  <div class="wp-pv wp-wc">
    <div class="wp-pv-stats">
      <div class="wp-pv-stat">
        <b>{{ options.length }}</b><span>option{{ options.length === 1 ? "" : "s" }}</span>
      </div>
      <div
        v-if="axes.length"
        class="wp-pv-stat"
      >
        <b>{{ axes.length }}</b><span>tag ax{{ axes.length === 1 ? "is" : "es" }} · {{ tagTotal }} tags</span>
      </div>
      <div
        v-if="negCount"
        class="wp-pv-stat"
      >
        <b>{{ negCount }}</b><span>with a negative</span>
      </div>
      <div
        v-if="weightRange"
        class="wp-pv-stat"
      >
        <b>{{ weightRange }}</b><span>weight range</span>
      </div>
      <div
        v-if="refCount"
        class="wp-pv-stat"
      >
        <b>{{ refCount }}</b><span>use picks / @refs</span>
      </div>
    </div>

    <div class="wp-pv-tool">
      <SearchInput
        v-if="options.length > 8"
        v-model="search"
        :placeholder="`Filter ${options.length} options…`"
        data-test="wildcard-search"
        class="wp-pv-search"
      />
      <template v-if="axes.length">
        <span class="wp-pv-label">Group by</span>
        <WpSegmented
          :model-value="effectiveAxis?.name ?? 'none'"
          :options="groupOptions"
          size="sm"
          aria-label="Group by"
          test-prefix="groupby"
          @update:model-value="(v) => (groupBy = v)"
        />
      </template>
      <Chip
        v-if="negCount"
        size="sm"
        color="var(--wp-danger)"
        :pressed="onlyNeg"
        data-test="filter-negative"
        @click="onlyNeg = !onlyNeg"
      >Has negative</Chip>
      <Chip
        v-if="weighted"
        size="sm"
        :pressed="onlyWeighted"
        @click="onlyWeighted = !onlyWeighted"
      >Weighted</Chip>
      <Chip
        v-if="refCount"
        size="sm"
        :pressed="onlyRefs"
        @click="onlyRefs = !onlyRefs"
      >Uses picks / refs</Chip>
      <span
        v-if="filtering"
        class="wp-pv-count"
        data-test="wildcard-matches"
      >
        {{ visible.length }} of {{ options.length }}
        <Button
          variant="link"
          size="sm"
          @click="clearFilters"
        >clear</Button>
      </span>
      <WpSegmented
        v-model="view"
        class="wp-pv-tool__end"
        :options="VIEW_OPTIONS"
        size="sm"
        aria-label="Show as"
        test-prefix="view"
      />
    </div>

    <div
      class="wp-wc__split"
      :data-facets="showFacets || null"
    >
      <aside
        v-if="showFacets"
        class="wp-wc__facets wp-pv-hide-narrow"
      >
        <div
          v-for="a in axes"
          :key="a.name"
          class="wp-wc__facet"
        >
          <h5>{{ a.name }}</h5>
          <ListRow
            v-for="f in shownFacets(a)"
            :key="f.tag"
            size="sm"
            toggle
            class="wp-wc__facet-row"
            :selected="isPicked(a.name, f.tag)"
            :count="f.count"
            :data-test="`facet-${f.tag}`"
            @click="togglePick(a.name, f.tag)"
          >
            {{ f.tag }}
          </ListRow>
          <Button
            v-if="facetTags(a).length > FACET_PAGE"
            variant="link"
            size="sm"
            class="wp-wc__facet-more"
            @click="toggleFacetMore(a.name)"
          >
            {{ facetOpen.has(a.name) ? "fewer" : `+ ${facetTags(a).length - FACET_PAGE} more` }}
          </Button>
        </div>
      </aside>

      <div class="wp-wildcard-groups">
        <p
          v-if="!groups.length"
          class="wp-pv-empty"
        >
          No options match these filters.
        </p>
        <PreviewGroup
          v-for="(g, gidx) in groups"
          :key="g.name || '_'"
          class="wp-wildcard-group"
          :name="g.name"
          :open="isOpen(g.name, gidx)"
          :count="g.options.length"
          :aside="share(g)"
          :test-id="`group-${g.name}`"
          @update:open="toggled = flip(toggled, g.name)"
        >
          <table
            v-if="view === 'list'"
            class="wp-pv-table"
          >
            <colgroup>
              <col class="wp-pv-col-n">
              <col>
              <col class="wp-wc__col-chance">
              <col
                v-if="axes.length"
                class="wp-pv-hide-narrow"
                style="width: 22%"
              >
              <col
                v-if="negCount"
                style="width: 26%"
              >
            </colgroup>
            <tbody>
              <tr
                v-for="(o, oidx) in rowsOf(g)"
                :key="oidx"
                class="wp-wildcard-option"
              >
                <td class="wp-pv-n">
                  {{ oidx + 1 }}
                </td>
                <td>
                  <div
                    :class="{ 'wp-pv-clamp': isLong(o) && !expanded.has(`${g.name}|${oidx}`) }"
                    class="wp-wildcard-option__value"
                    :data-long="isLong(o) || null"
                  >
                    <TokenizedValue
                      :value="o.value"
                      :uuid-to-name="refMap"
                    />
                  </div>
                  <Button
                    v-if="isLong(o)"
                    variant="link"
                    size="sm"
                    @click="expanded = flip(expanded, `${g.name}|${oidx}`)"
                  >{{ expanded.has(`${g.name}|${oidx}`) ? "Show less" : "Show all" }}</Button>
                </td>
                <td class="wp-wc__chance">
                  <span>{{ totalWeight ? pct(Math.max(0, o.weight)) : "—" }}<template v-if="o.weight !== 1"> · ×{{ fmt(o.weight) }}</template></span>
                  <span
                    v-if="o.fallback"
                    class="wp-pv-fbtag"
                    data-test="option-fallback"
                    title="Rolls normally, and is also used when nothing else is left to pick."
                  >fallback</span>
                  <div class="wp-wc__bar">
                    <b :style="{ width: `${maxWeight ? (Math.max(0, o.weight) / maxWeight) * 100 : 0}%` }" />
                  </div>
                </td>
                <td
                  v-if="axes.length"
                  class="wp-pv-hide-narrow"
                >
                  <span
                    v-for="t in o.tags"
                    :key="t"
                    class="wp-wc__tag"
                  >{{ t }}</span>
                </td>
                <td
                  v-if="negCount"
                  class="wp-pv-neg-cell"
                >
                  <span
                    v-if="o.negative"
                    data-test="option-negative"
                  >
                    <span class="wp-pv-negtag">NEG</span>
                    <TokenizedValue
                      :value="o.negative"
                      :uuid-to-name="refMap"
                    />
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <ul
            v-else
            class="wp-wc__chips"
          >
            <li
              v-for="(o, oidx) in rowsOf(g)"
              :key="oidx"
              class="wp-wildcard-option"
              :title="o.tags.join(' · ')"
            >
              <span :class="{ 'wp-pv-clamp': isLong(o) }">
                <TokenizedValue
                  :value="o.value"
                  :uuid-to-name="refMap"
                />
              </span>
              <span
                v-if="o.negative"
                class="wp-wc__chipneg"
                data-test="option-negative"
              >
                <span class="wp-pv-negtag">NEG</span>
                <TokenizedValue
                  :value="o.negative"
                  :uuid-to-name="refMap"
                />
              </span>
              <span
                v-if="o.fallback"
                class="wp-pv-fbtag"
                data-test="option-fallback"
                title="Rolls normally, and is also used when nothing else is left to pick."
              >fallback</span>
              <span
                v-if="o.weight !== 1"
                class="wp-wc__w"
              >×{{ fmt(o.weight) }}</span>
            </li>
          </ul>
          <div
            v-if="g.options.length > PAGE"
            class="wp-pv-more"
          >
            <Button
              variant="link"
              size="sm"
              :data-test="`more-${g.name || '_'}`"
              @click="fullGroups = flip(fullGroups, g.name)"
            >
              {{
                fullGroups.has(g.name)
                  ? "Show fewer"
                  : `Show ${g.options.length - PAGE} more${g.name ? ` in ${g.name}` : ""}`
              }}
            </Button>
          </div>
        </PreviewGroup>
      </div>
    </div>
  </div>
</template>

<style scoped src="./preview.css"></style>
<style scoped>
.wp-wc__split[data-facets] {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
}
@container (max-width: 640px) {
  .wp-wc__split[data-facets] {
    grid-template-columns: minmax(0, 1fr);
  }
}
.wp-wc__facets {
  border-right: 1px solid var(--wp-border);
  padding: 6px 0 12px;
}
.wp-wc__facet h5 {
  margin: 10px 16px 4px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--wp-text-dim);
  text-transform: uppercase;
}
.wp-wc__facet-more {
  margin: 2px 12px 0;
}
.wp-wc__chance span {
  font-family: var(--wp-font-mono);
  font-size: 11px;
  color: var(--wp-text-muted);
  white-space: nowrap;
}
.wp-wc__chance .wp-pv-fbtag {
  margin-left: 6px;
  font-size: 10px;
  color: var(--wp-accent-text);
}
.wp-wc__col-chance {
  width: 112px;
}
@container (max-width: 640px) {
  .wp-wc__col-chance {
    width: 56px;
  }
  .wp-wc__bar {
    display: none;
  }
}
.wp-wc__bar {
  height: 4px;
  margin-top: 6px;
  border-radius: min(2px, var(--wp-radius-cap, 999px));
  background: var(--wp-bg-4);
}
.wp-wc__bar b {
  display: block;
  height: 4px;
  border-radius: min(2px, var(--wp-radius-cap, 999px));
  background: var(--wp-accent-500);
}
.wp-wc__tag {
  display: inline-block;
  margin: 0 3px 3px 0;
  padding: 0 6px;
  border-radius: min(4px, var(--wp-radius-cap, 999px));
  background: var(--wp-bg-3);
  color: var(--wp-text-muted);
  font-size: 10.5px;
}
.wp-wc__chips {
  list-style: none;
  margin: 0;
  padding: 10px 16px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border-bottom: 1px solid var(--wp-border);
}
.wp-wc__chips li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 3px 10px;
  border-radius: min(10px, var(--wp-radius-cap, 999px));
  background: var(--wp-bg-3);
  color: var(--wp-text);
  font-size: 13px;
}
.wp-wc__chipneg {
  padding-left: 6px;
  border-left: 1px solid var(--wp-border);
  color: var(--wp-danger-text, var(--wp-danger));
  font-size: 12px;
}
.wp-wc__w {
  font-family: var(--wp-font-mono);
  font-size: 10.5px;
  color: var(--wp-text-muted);
}
</style>
