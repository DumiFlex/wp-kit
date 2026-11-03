<script setup lang="ts">
// The shared preview sheet (wp-pv-* classes), loaded once for every preview.
import "./preview.css";
/**
 * Constraint: counts up top, then the grouped matrix (ConstraintMatrixPreview)
 * or, for a big matrix, a searchable list of only the cells that do
 * something. The search narrows rows / columns in both views.
 */
import { computed, ref } from "vue";
import ConstraintMatrixPreview from "./ConstraintMatrixPreview.vue";
import { MODE_GLYPH as GLYPH, MODE_LABEL as LABEL, normalizeMode, type CellMode as Mode } from "./matrix-axis";
import {
  readArray,
  readGroups,
  readNumber,
  readObject,
  readString,
  type Obj,
} from "./preview-readers";
import WpSegmented, { type SegmentedOption } from "./WpSegmented.vue";
import SearchInput from "./SearchInput.vue";

const props = defineProps<{
  inner: Obj | null;
  refMap: ReadonlyMap<string, string>;
  refNames: Record<string, string>;
  refGroups: Record<string, Record<string, string[]>>;
}>();

interface Cell {
  mode: Mode;
  factor: number;
}

const matrix = computed<Record<string, Record<string, Cell>>>(() => {
  const m = readObject(props.inner, "matrix");
  if (!m) return {};
  const out: Record<string, Record<string, Cell>> = {};
  for (const row of Object.keys(m)) {
    const byCol = readObject(m, row);
    if (!byCol) continue;
    out[row] = {};
    for (const col of Object.keys(byCol)) {
      const e = readObject(byCol, col);
      if (!e) continue;
      out[row][col] = { mode: normalizeMode(readString(e, "mode")), factor: readNumber(e, "factor") ?? 1 };
    }
  }
  return out;
});
const rows = computed(() => Object.keys(matrix.value));
/** Union of every row's columns, first-seen order. */
const cols = computed(() => {
  const seen = new Set<string>();
  for (const r of rows.value) for (const c of Object.keys(matrix.value[r] ?? {})) seen.add(c);
  return [...seen];
});
/** Axis names: cached name → dependency name → raw id → role word. */
function axisName(idKey: string, nameKey: string, role: string): string {
  const id = readString(props.inner, idKey);
  return readString(props.inner, nameKey) ?? (id ? props.refNames[id] : undefined) ?? id ?? role;
}
const sourceName = computed(() => axisName("source_wildcard_id", "source_wildcard_name", "source"));
const targetName = computed(() => axisName("target_wildcard_id", "target_wildcard_name", "target"));
/** Embedded axis snapshot first, then the dependency's tag_groups. */
function axisGroups(embeddedKey: string, idKey: string): Record<string, string[]> {
  const embedded = readGroups(props.inner, embeddedKey);
  if (embedded) return embedded;
  const id = readString(props.inner, idKey);
  return (id ? props.refGroups[id] : undefined) ?? {};
}
const sourceGroups = computed(() => axisGroups("source_groups", "source_wildcard_id"));
const targetGroups = computed(() => axisGroups("target_groups", "target_wildcard_id"));
/** Library exceptions only; instance `extra_exceptions` never publish. */
const exceptions = computed(() =>
  readArray(props.inner, "exceptions").map((e) => ({
    source: readString(e, "source_value") ?? readString(e, "source") ?? "",
    target: readString(e, "target_value") ?? readString(e, "target") ?? "",
    mode: normalizeMode(readString(e, "mode")),
    factor: readNumber(e, "factor") ?? 1,
  })),
);
const targetSelect = computed(() => {
  const sel = readObject(props.inner, "target_select");
  const mode = readString(sel, "mode");
  if (!mode) return null;
  const count = readNumber(sel, "count");
  return count !== null ? `${mode} ${count}` : mode;
});

const ruleCells = computed(() => {
  const out: { row: string; col: string; cell: Cell }[] = [];
  for (const r of rows.value)
    for (const c of cols.value) {
      const cell = matrix.value[r]?.[c];
      if (cell && cell.mode !== "allow") out.push({ row: r, col: c, cell });
    }
  return out;
});
const excludeCount = computed(() => ruleCells.value.filter((x) => x.cell.mode === "exclude").length);

// ─── search + view ───
const search = ref("");
const q = computed(() => search.value.trim().toLowerCase());
const shownRows = computed(() => {
  if (!q.value) return rows.value;
  const hit = rows.value.filter((r) => r.toLowerCase().includes(q.value));
  return hit.length ? hit : rows.value;
});
const shownCols = computed(() => {
  if (!q.value) return cols.value;
  const hit = cols.value.filter((c) => c.toLowerCase().includes(q.value));
  return hit.length ? hit : cols.value;
});
const big = computed(() => rows.value.length * cols.value.length > 60);
const view = ref<"matrix" | "list">("matrix");
const VIEW_OPTIONS: SegmentedOption<"matrix" | "list">[] = [
  { value: "matrix", label: "Matrix" },
  { value: "list", label: "Rules list" },
];
const listRows = computed(() =>
  ruleCells.value.filter(
    (x) => !q.value || x.row.toLowerCase().includes(q.value) || x.col.toLowerCase().includes(q.value),
  ),
);
function fmtFactor(f: number): string {
  return Number.isInteger(f) ? String(f) : f.toFixed(2).replace(/\.?0+$/, "");
}
</script>

<template>
  <div class="wp-pv">
    <div class="wp-pv-stats">
      <div class="wp-pv-stat">
        <b>{{ rows.length }} × {{ cols.length }}</b><span>sources × targets</span>
      </div>
      <div class="wp-pv-stat">
        <b>{{ ruleCells.length }}</b><span>rules set</span>
      </div>
      <div
        v-if="excludeCount"
        class="wp-pv-stat"
      >
        <b>{{ excludeCount }}</b><span>excludes</span>
      </div>
      <div
        v-if="exceptions.length"
        class="wp-pv-stat"
      >
        <b>{{ exceptions.length }}</b><span>exception{{ exceptions.length === 1 ? "" : "s" }}</span>
      </div>
      <div
        v-if="targetSelect"
        class="wp-pv-stat"
      >
        <b>{{ targetSelect }}</b><span>reach</span>
      </div>
    </div>
    <div
      v-if="big"
      class="wp-pv-tool"
    >
      <SearchInput
        v-model="search"
        placeholder="Filter rows or columns…"
        data-test="constraint-search"
        class="wp-pv-search"
      />
      <span class="wp-pv-label">Show</span>
      <WpSegmented
        v-model="view"
        :options="VIEW_OPTIONS"
        size="sm"
        aria-label="Show"
        test-prefix="constraint"
      />
    </div>
    <div
      v-if="view === 'matrix'"
      class="wp-cn-wrap"
    >
      <ConstraintMatrixPreview
        :rows="shownRows"
        :cols="shownCols"
        :matrix="matrix"
        :source-name="sourceName"
        :target-name="targetName"
        :source-groups="sourceGroups"
        :target-groups="targetGroups"
        :exceptions="exceptions"
        :target-select="targetSelect"
        :ref-map="refMap"
      />
    </div>
    <template v-else>
      <table class="wp-pv-table">
        <thead>
          <tr>
            <th>{{ sourceName }}</th>
            <th>{{ targetName }}</th>
            <th>Rule</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="x in listRows"
            :key="`${x.row}|${x.col}`"
            data-test="constraint-rule"
          >
            <td>{{ x.row }}</td>
            <td>{{ x.col }}</td>
            <td>
              <span
                class="wp-cn-rule"
                :data-mode="x.cell.mode"
              >{{ GLYPH[x.cell.mode] }} {{ LABEL[x.cell.mode] }}<template v-if="x.cell.mode === 'boost' || x.cell.mode === 'reduce'"> ×{{ fmtFactor(x.cell.factor) }}</template></span>
            </td>
          </tr>
        </tbody>
      </table>
      <p
        v-if="!listRows.length"
        class="wp-pv-empty"
      >
        No rules match.
      </p>
    </template>
  </div>
</template>

<style scoped>
.wp-cn-wrap {
  padding: 14px 16px 16px;
  min-width: 0;
}
.wp-cn-rule {
  font-family: var(--wp-font-mono);
  font-size: 11.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: min(5px, var(--wp-radius-cap, 999px));
  background: var(--wp-bg-3);
}
.wp-cn-rule[data-mode="boost"] {
  color: var(--wp-success);
  background: color-mix(in oklab, var(--wp-success) 14%, transparent);
}
.wp-cn-rule[data-mode="reduce"] {
  color: var(--wp-warn);
  background: color-mix(in oklab, var(--wp-warn) 14%, transparent);
}
.wp-cn-rule[data-mode="exclude"] {
  color: var(--wp-danger-text, var(--wp-danger));
  background: color-mix(in oklab, var(--wp-danger) 15%, transparent);
}
.wp-cn-rule[data-mode="only"] {
  color: color-mix(in oklab, var(--wp-info) 55%, white);
  background: color-mix(in oklab, var(--wp-info) 16%, transparent);
}
</style>
