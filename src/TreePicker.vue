<script setup lang="ts">
/**
 * TreePicker: pick several items from a tree (post categories, tag groups).
 * A search box on top, the picks as removable chips under it, then one
 * folding row per top-level item with its children as toggle chips; a
 * search turns the rows into one list of matches with their path. Items with
 * no children share one row at the top. Each row's count says how many picks
 * sit under it, and rows with picks start open.
 *
 *   <TreePicker v-model="slugs" :items="tree" :max="20" noun="categories" />
 *
 * `items` are `{ id, label, children? }`; the v-model holds ids in the order
 * they were picked. Past `max` the unpicked chips are disabled.
 */
import { computed, ref } from "vue";
import Chip from "./Chip.vue";
import Disclosure from "./Disclosure.vue";
import SearchInput from "./SearchInput.vue";
import { flattenTree, pickedUnder, searchTree, togglePick, type TreePickerNode, type TreePickerRow } from "./tree-picker";

const props = withDefaults(defineProps<{
  items: TreePickerNode[];
  /** The most ids that can be picked. */
  max?: number | undefined;
  /** Plural noun for the counts and the search ("categories"). */
  noun?: string | undefined;
  /** Label of the row that holds the items with no children. */
  looseLabel?: string | undefined;
  disabled?: boolean | undefined;
  /** Prefix for `data-test` hooks. */
  testPrefix?: string | undefined;
}>(), { max: Infinity, noun: "items", looseLabel: "General", testPrefix: "tree-picker" });

const model = defineModel<string[]>({ required: true });
const query = ref("");

const rows = computed(() => flattenTree(props.items));
const byId = computed(() => new Map(rows.value.map((r) => [r.id, r])));
const picked = computed(() => new Set(model.value));
const atMax = computed(() => model.value.length >= props.max);

/** Top-level items with no children: one shared row. */
const loose = computed(() => props.items.filter((n) => !n.children?.length));
const groups = computed(() => props.items.filter((n) => n.children?.length));
const matches = computed(() => searchTree(rows.value, query.value));
const searching = computed(() => query.value.trim() !== "");

/** The chips inside a group: the parent, then everything under it, with the path below the parent. */
function groupRows(node: TreePickerNode): TreePickerRow[] {
  const all = flattenTree([node]);
  return all.map((r) => ({ ...r, path: r.path.slice(1) }));
}

/** Picks that are no longer in the tree still show, by id, so they can be removed. */
const pickedRows = computed(() =>
  model.value.map((id) => byId.value.get(id) ?? { id, label: id, path: [] }),
);

function toggle(id: string): void {
  if (props.disabled) return;
  model.value = togglePick(model.value, id, props.max);
}

function crumb(path: string[]): string {
  return path.length ? `${path.join(" › ")} ›` : "";
}

const countText = computed(() =>
  Number.isFinite(props.max) ? `${model.value.length} of ${props.max}` : `${model.value.length}`,
);
</script>

<template>
  <div class="wp-tree-picker" :data-test="testPrefix">
    <SearchInput
      v-model="query"
      :placeholder="`Search ${noun}…`"
      :aria-label="`Search ${noun}`"
      :visible="searching ? matches.length : undefined"
      :total="searching ? rows.length : undefined"
      :disabled="disabled"
      :data-test="`${testPrefix}-search`"
    />

    <div class="wp-tree-picker__picked" :data-test="`${testPrefix}-picked`">
      <span class="wp-tree-picker__count">{{ countText }}</span>
      <span v-if="!model.length" class="wp-tree-picker__muted">None picked yet.</span>
      <Chip
        v-for="r in pickedRows"
        :key="r.id"
        size="sm"
        tone="accent"
        removable
        :data-id="r.id"
        @remove="toggle(r.id)"
      >
        <span v-if="r.path.length" class="wp-tree-picker__crumb">{{ crumb(r.path) }}</span>{{ r.label }}
      </Chip>
    </div>

    <div v-if="searching" class="wp-tree-picker__chips" :data-test="`${testPrefix}-matches`">
      <Chip
        v-for="r in matches"
        :key="r.id"
        size="sm"
        :pressed="picked.has(r.id)"
        :icon="picked.has(r.id) ? 'pi-check' : undefined"
        :disabled="disabled || (!picked.has(r.id) && atMax)"
        :data-id="r.id"
        @click="toggle(r.id)"
      >
        <span v-if="r.path.length" class="wp-tree-picker__crumb">{{ crumb(r.path) }}</span>{{ r.label }}
      </Chip>
      <span v-if="!matches.length" class="wp-tree-picker__muted">No {{ noun }} match “{{ query.trim() }}”.</span>
    </div>

    <div v-else class="wp-tree-picker__groups">
      <Disclosure
        v-if="loose.length"
        :label="looseLabel"
        :count="loose.filter((n) => picked.has(n.id)).length || undefined"
        :default-open="true"
        flush
        size="sm"
      >
        <div class="wp-tree-picker__chips">
          <Chip
            v-for="n in loose"
            :key="n.id"
            size="sm"
            :pressed="picked.has(n.id)"
            :icon="picked.has(n.id) ? 'pi-check' : undefined"
            :disabled="disabled || (!picked.has(n.id) && atMax)"
            :data-id="n.id"
            @click="toggle(n.id)"
          >
            {{ n.label.trim() }}
          </Chip>
        </div>
      </Disclosure>
      <Disclosure
        v-for="g in groups"
        :key="g.id"
        :label="g.label.trim()"
        :count="pickedUnder(g, picked) || undefined"
        :default-open="pickedUnder(g, picked) > 0"
        :trigger-attrs="{ 'data-test': `${testPrefix}-group-${g.id}` }"
        flush
        size="sm"
      >
        <div class="wp-tree-picker__chips">
          <Chip
            v-for="r in groupRows(g)"
            :key="r.id"
            size="sm"
            :pressed="picked.has(r.id)"
            :icon="picked.has(r.id) ? 'pi-check' : undefined"
            :disabled="disabled || (!picked.has(r.id) && atMax)"
            :data-id="r.id"
            @click="toggle(r.id)"
          >
            <span v-if="r.path.length" class="wp-tree-picker__crumb">{{ crumb(r.path) }}</span>{{ r.label }}
          </Chip>
        </div>
      </Disclosure>
    </div>
  </div>
</template>

<style scoped>
.wp-tree-picker {
  display: flex;
  flex-direction: column;
  gap: var(--wp-space-2);
  min-width: 0;
}
.wp-tree-picker__picked {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: var(--wp-control-h-sm);
}
.wp-tree-picker__count {
  color: var(--wp-text-muted);
  font-size: var(--wp-text-xs);
  font-variant-numeric: tabular-nums;
  margin-right: 2px;
}
.wp-tree-picker__muted {
  color: var(--wp-text-muted);
  font-size: var(--wp-text-sm);
}
.wp-tree-picker__groups {
  border: 1px solid var(--wp-border);
  border-radius: min(8px, var(--wp-radius-cap, 999px));
  overflow: hidden;
}
.wp-tree-picker__groups > :deep(.wp-disclosure:last-child .wp-disclosure__head) {
  border-bottom: 0;
}
.wp-tree-picker__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: var(--wp-space-2) var(--wp-space-3);
}
.wp-tree-picker__crumb {
  color: var(--wp-text-muted);
  white-space: nowrap;
}
</style>
