<script setup lang="ts">
// The shared preview sheet (wp-pv-* classes), loaded once for every preview.
import "./preview.css";
/**
 * Bundle: what the bundle needs from outside vs what it sets (folded from
 * its children), then a child list beside the selected child's own full
 * preview. Narrow hosts stack the list above the preview.
 */
import { computed, ref } from "vue";
import PayloadPreview from "./PayloadPreview.vue";
import ListRow from "./ListRow.vue";
import Chip from "./Chip.vue";
import { itemType, kindColour, kindIcon, moduleSubtype } from "./kind-colour";
import {
  derivationRules,
  fixedValues,
  innerOf,
  readArray,
  readGroups,
  readObject,
  readString,
  varFlow,
  wildcardOptions,
  type Obj,
} from "./preview-readers";

const props = defineProps<{
  payload: Obj;
  refNames: Record<string, string>;
  refGroups: Record<string, Record<string, string[]>>;
}>();

interface Child {
  key: string;
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  raw: Obj;
}
function childName(c: unknown): string | null {
  const meta = readObject(c, "meta");
  return (
    readString(meta, "name") ??
    readString(meta, "library_name") ??
    readString(c, "name") ??
    readString(readObject(c, "payload"), "var_binding")
  );
}
const children = computed<Child[]>(() =>
  readArray(props.payload, "children").map((c, i) => ({
    key: readString(c, "id") ?? String(i),
    id: readString(c, "id") ?? "",
    name: childName(c) ?? "—",
    type: readString(c, "type") ?? "—",
    enabled: (c as Obj | null)?.["enabled"] !== false,
    raw: (c && typeof c === "object" ? c : {}) as Obj,
  })),
);
/** Sibling names + wildcard axes so a child constraint resolves its
 *  wildcards the same way the list does. */
const childRefNames = computed(() => {
  const out: Record<string, string> = { ...props.refNames };
  for (const c of children.value) if (c.id) out[c.id] = c.name;
  return out;
});
const childRefGroups = computed(() => {
  const out: Record<string, Record<string, string[]>> = { ...props.refGroups };
  for (const c of children.value) {
    const g = readGroups(innerOf(c.raw), "tag_groups");
    if (c.id && g) out[c.id] = g;
  }
  return out;
});
function summary(c: Child): string {
  const inner = innerOf(c.raw);
  const label = c.type.replace(/_/g, " ");
  switch (c.type) {
    case "wildcard": {
      const n = wildcardOptions(inner).length;
      const b = readString(inner, "var_binding");
      return `${label} · ${n} option${n === 1 ? "" : "s"}${b ? ` · $${b}` : ""}`;
    }
    case "fixed_values": {
      const n = fixedValues(inner).length;
      return `${label} · ${n} value${n === 1 ? "" : "s"}`;
    }
    case "derivation": {
      const n = derivationRules(inner).length;
      return `${label} · ${n} rule${n === 1 ? "" : "s"}`;
    }
    case "combine": {
      const out = readString(inner, "output_var");
      return out ? `${label} · $${out}` : label;
    }
    case "constraint": {
      const s = readString(inner, "source_wildcard_id");
      const t = readString(inner, "target_wildcard_id");
      const name = (id: string | null): string => (id ? (childRefNames.value[id] ?? id) : "?");
      return `${label} · ${name(s)} → ${name(t)}`;
    }
    default:
      return label;
  }
}
const flow = computed(() => varFlow(props.payload));
const provide = computed(() => flow.value.reads.filter((v) => !flow.value.sets.includes(v)));

const selected = ref<string | null>(null);
const current = computed(
  () => children.value.find((c) => c.key === selected.value) ?? children.value[0] ?? null,
);
const counts = computed(() => {
  const out: Record<string, number> = {};
  for (const c of children.value) out[c.type] = (out[c.type] ?? 0) + 1;
  return out;
});
</script>

<template>
  <div class="wp-pv wp-bundle">
    <div class="wp-pv-stats">
      <div class="wp-pv-stat">
        <b>{{ children.length }}</b><span>module{{ children.length === 1 ? "" : "s" }}</span>
      </div>
      <div
        v-for="(n, t) in counts"
        :key="t"
        class="wp-pv-stat wp-pv-hide-narrow"
      >
        <b>{{ n }}</b><span>{{ String(t).replace(/_/g, " ") }}</span>
      </div>
    </div>
    <div
      v-if="provide.length || flow.sets.length"
      class="wp-bd-flow"
    >
      <template v-if="provide.length">
        <span class="wp-pv-label">You provide</span>
        <div>
          <code
            v-for="v in provide"
            :key="`p-${v}`"
            class="wp-bd-var"
          >${{ v }}</code>
          <span class="wp-bd-hint">read inside, not set by any module here</span>
        </div>
      </template>
      <template v-if="flow.sets.length">
        <span class="wp-pv-label">It sets</span>
        <div>
          <code
            v-for="v in flow.sets"
            :key="`s-${v}`"
            class="wp-bd-var"
          >${{ v }}</code>
        </div>
      </template>
    </div>
    <div class="wp-bd-split">
      <nav
        class="wp-bd-kids wp-bundle-children"
        data-wp-rows
      >
        <ListRow
          v-for="c in children"
          :key="c.key"
          class="wp-bd-kid wp-bundle-child"
          :selected="current?.key === c.key"
          :icon="kindIcon(c.type)"
          :description="`${summary(c)}${c.enabled ? '' : ' · disabled'}`"
          :muted="!c.enabled"
          data-test="bundle-child"
          @click="selected = c.key"
        >
          {{ c.name }}
        </ListRow>
      </nav>
      <div
        v-if="current"
        class="wp-bd-pane"
        data-test="bundle-child-body"
      >
        <div class="wp-bd-pane__head">
          <Chip v-if="moduleSubtype(current.type)" :color="kindColour(itemType('module', moduleSubtype(current.type)))">{{ itemType('module', moduleSubtype(current.type)) }}</Chip>
          <Chip v-else>{{ current.type }}</Chip>
          <b>{{ current.name }}</b>
        </div>
        <PayloadPreview
          :payload="current.raw"
          :ref-names="childRefNames"
          :ref-groups="childRefGroups"
          nested
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.wp-bd-flow {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 6px 14px;
  align-items: baseline;
  padding: 12px 16px;
  border-bottom: 1px solid var(--wp-border);
}
.wp-bd-flow > div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: baseline;
}
.wp-bd-var {
  font-family: var(--wp-font-mono);
  font-size: 12px;
  color: var(--wp-success);
}
.wp-bd-hint {
  font-size: 11.5px;
  color: var(--wp-text-dim);
}
.wp-bd-split {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
}
@container (max-width: 700px) {
  .wp-bd-split {
    grid-template-columns: minmax(0, 1fr);
  }
  .wp-bd-kids {
    border-right: 0;
    border-bottom: 1px solid var(--wp-border);
  }
}
.wp-bd-kids {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-right: 1px solid var(--wp-border);
}
.wp-bd-pane {
  min-width: 0;
}
.wp-bd-pane__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--wp-border);
  font-size: 13px;
}
</style>
