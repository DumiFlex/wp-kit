<script setup lang="ts">
/**
 * The grid inside IconPicker (in its Popover, or on its own with `inline`).
 * Internal: use IconPicker. Without `all` it offers the curated groups in
 * `icon-catalog.ts`; with `all`, every PrimeIcons glyph (`pi-icons.ts`) and a
 * search box. Emits the picked name without `pi-`, or null for No icon.
 */
import { computed, ref } from "vue";
import SearchInput from "./SearchInput.vue";
import { vTooltip } from "./tooltip";
import { ICON_GROUPS } from "./icon-catalog";
import { PI_ICONS } from "./pi-icons";

const props = withDefaults(defineProps<{
  current: string | null;
  all?: boolean | undefined;
  /** Tint the glyphs (a note's colour). */
  color?: string | undefined;
  allowNone?: boolean | undefined;
  dataTest?: string | undefined;
}>(), { all: false, color: undefined, allowNone: true, dataTest: undefined });

const emit = defineEmits<{ pick: [name: string | null] }>();

const query = ref("");
const words = (name: string): string => name.replace(/-/g, " ");
/** "arrow right" and "pi-arrow-right" both find arrow-right. */
const found = computed(() => {
  const q = query.value.trim().toLowerCase().replace(/^pi-/, "").replace(/\s+/g, "-");
  return q ? PI_ICONS.filter((n) => n.includes(q)) : PI_ICONS;
});
const groups = computed(() => (props.all ? [{ label: "", icons: found.value }] : ICON_GROUPS));
const tint = computed(() => (props.color ? { color: props.color } : undefined));
</script>

<template>
  <div class="wp-iconpick__panel" :data-all="all || undefined" :data-test="dataTest ? `${dataTest}-panel` : undefined">
    <SearchInput
      v-if="all"
      v-model="query"
      size="sm"
      placeholder="Search icons…"
      aria-label="Search icons"
      test-prefix="icon-picker"
      class="wp-iconpick__search"
    />
    <button
      v-if="allowNone"
      type="button"
      class="wp-iconpick__clear"
      :aria-pressed="!current"
      data-test="icon-picker-none"
      @click="emit('pick', null)"
    >No icon</button>
    <div v-for="group in groups" :key="group.label" class="wp-iconpick__group">
      <div v-if="group.label" class="wp-iconpick__group-label">{{ group.label }}</div>
      <div class="wp-iconpick__grid" role="listbox" :aria-label="group.label || 'Icons'">
        <button
          v-for="name in group.icons"
          :key="name"
          v-tooltip="words(name)"
          type="button"
          class="wp-iconpick__cell"
          :class="{ 'wp-iconpick__cell--on': name === current }"
          role="option"
          :aria-selected="name === current"
          :aria-label="words(name)"
          :data-test="`icon-picker-${name}`"
          @click="emit('pick', name)"
        ><i :class="`pi pi-${name}`" :style="tint" aria-hidden="true" /></button>
        <p v-if="!group.icons.length" class="wp-iconpick__empty">No icon matches "{{ query }}".</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wp-iconpick__panel {
  width: 212px;
  max-height: 276px;
  overflow-y: auto;
}
.wp-iconpick__panel[data-all] { width: 264px; }
/* Stays at the top while the glyphs scroll under it. */
.wp-iconpick__search { position: sticky; top: 0; z-index: 1; margin-bottom: var(--wp-space-3); box-shadow: 0 0 0 var(--wp-space-2) var(--wp-bg-2); background: var(--wp-bg-2); }
.wp-iconpick__clear {
  width: 100%;
  margin-bottom: var(--wp-space-3);
  padding: var(--wp-space-2);
  background: transparent;
  border: 1px dashed var(--wp-border);
  border-radius: var(--wp-radius-sm);
  color: var(--wp-text-muted);
  font: inherit;
  font-size: var(--wp-text-xs);
  cursor: pointer;
}
.wp-iconpick__clear:hover { color: var(--wp-text); border-color: var(--wp-accent); }
.wp-iconpick__clear[aria-pressed="true"] { border-style: solid; border-color: var(--wp-accent); color: var(--wp-text); }
.wp-iconpick__clear:focus-visible, .wp-iconpick__cell:focus-visible { outline: none; box-shadow: var(--wp-focus-ring); }
.wp-iconpick__group + .wp-iconpick__group { margin-top: var(--wp-space-3); }
.wp-iconpick__group-label {
  margin-bottom: var(--wp-space-2);
  font-size: var(--wp-text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--wp-text-dim);
}
.wp-iconpick__grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
}
.wp-iconpick__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--wp-radius-sm);
  color: var(--wp-text-muted);
  cursor: pointer;
}
/* An even size, on whole pixels; the font's own line box would push it off centre. */
.wp-iconpick__cell .pi { font-size: 14px; line-height: 1; }
.wp-iconpick__cell:hover { background: color-mix(in oklab, var(--wp-accent) 18%, transparent); color: var(--wp-text); }
.wp-iconpick__cell--on { border-color: var(--wp-accent); color: var(--wp-accent); }
.wp-iconpick__empty { grid-column: 1 / -1; margin: var(--wp-space-2) 0; color: var(--wp-text-dim); font-size: var(--wp-text-sm); }
</style>
