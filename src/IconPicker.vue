<script setup lang="ts">
/**
 * IconPicker: pick one PrimeIcons glyph, or none.
 *
 *   <IconPicker v-model="cat.icon" />                      curated groups in a popover
 *   <IconPicker v-model="note.icon" all :color="tint" />   any glyph, with a search box
 *   <IconPicker :model-value="null" all inline :allow-none="false" @update:model-value="insert" />
 *
 * The closed picker shows the glyph and its name (`compact`: the glyph
 * alone, for a table cell). The list opens in the kit Popover, so it follows
 * the trigger on scroll, flips to stay on screen and closes on Escape or a
 * click outside with focus back on the trigger. `inline` draws the list
 * itself, with no trigger (a panel in an editor). Without `all` the list is
 * the curated groups in `icon-catalog.ts`; with `all` it is every glyph
 * (`pi-icons.ts`, both checked against the installed `primeicons.css` by a
 * test), searchable by name. `color` tints the glyphs; `allow-none` (on by
 * default) offers "No icon", which sets null.
 *
 * The name is stored WITHOUT the `pi pi-` prefix (`"user"`), which is what
 * Icon.vue expects.
 */
import { computed, ref } from "vue";
import IconPickerPanel from "./IconPickerPanel.vue";
import Popover from "./Popover.vue";

const props = withDefaults(
  defineProps<{
    /** Current glyph name, unprefixed (`"user"`). Empty / null = none. */
    modelValue: string | null;
    ariaLabel?: string | undefined;
    dataTest?: string | undefined;
    /** Icon only, no name beside it, for a tight table cell. */
    compact?: boolean | undefined;
    /** Every PrimeIcons glyph, with a search box, instead of the curated groups. */
    all?: boolean | undefined;
    /** The list itself, no trigger or popover. */
    inline?: boolean | undefined;
    /** Tint the glyphs. */
    color?: string | undefined;
    /** Offer "No icon" (null). */
    allowNone?: boolean | undefined;
  }>(),
  { ariaLabel: "Pick an icon", dataTest: undefined, compact: false, all: false, inline: false, color: undefined, allowNone: true },
);

const emit = defineEmits<{ "update:modelValue": [v: string | null] }>();

const open = ref(false);
const current = computed<string | null>(() => props.modelValue || null);

/** "arrow-right" → "Arrow right": the closed picker says which icon it holds. */
const currentName = computed(() => {
  const n = current.value;
  if (!n) return "Choose icon";
  const words = n.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
});

function pick(name: string | null): void {
  emit("update:modelValue", name);
  open.value = false;
}
</script>

<template>
  <div v-if="inline" class="wp-iconpick wp-iconpick--inline" :data-test="dataTest">
    <IconPickerPanel :current="current" :all="all" :color="color" :allow-none="allowNone" @pick="pick" />
  </div>
  <Popover v-else v-model:open="open" :label="ariaLabel" role="listbox">
    <template #trigger="{ props: triggerProps }">
      <button
        v-bind="triggerProps"
        type="button"
        class="wp-iconpick__trigger"
        :class="{ 'wp-iconpick__trigger--compact': compact }"
        :aria-label="`${ariaLabel}: ${current ? currentName : 'none'}`"
        :data-test="dataTest"
      >
        <!-- Both states share one fixed-size slot: an em-dash and a glyph have
             different intrinsic widths and baselines, so without it the trigger
             resized and the mark shifted the moment an icon was picked. -->
        <span class="wp-iconpick__slot" aria-hidden="true">
          <i v-if="current" :class="`pi pi-${current}`" :style="color ? { color } : undefined" />
          <span v-else class="wp-iconpick__none">—</span>
        </span>
        <span
          v-if="!compact"
          class="wp-iconpick__name"
          :class="{ 'wp-iconpick__name--empty': !current }"
          aria-hidden="true"
        >{{ currentName }}</span>
        <i class="pi pi-chevron-down wp-iconpick__caret" aria-hidden="true" />
      </button>
    </template>
    <IconPickerPanel :current="current" :all="all" :color="color" :allow-none="allowNone" :data-test="dataTest" @pick="pick" />
  </Popover>
</template>

<style scoped>
.wp-iconpick__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--wp-space-2);
  height: var(--wp-control-h-md, 32px);
  min-width: 140px;
  max-width: 220px;
  padding: 0 var(--wp-space-4) 0 var(--wp-space-3);
  background: var(--wp-bg-2);
  border: 1px solid var(--wp-border);
  border-radius: var(--wp-radius-sm);
  font: inherit;
  font-size: 12.5px;
  color: var(--wp-text);
  cursor: pointer;
}
.wp-iconpick__trigger:hover { border-color: var(--wp-border-strong); }
.wp-iconpick__trigger:focus-visible { outline: none; border-color: var(--wp-accent-500); box-shadow: var(--wp-focus-ring); }
.wp-iconpick__trigger--compact { min-width: 0; padding: 0 var(--wp-space-3); }
.wp-iconpick__name {
  flex: 1; min-width: 0; text-align: left;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.wp-iconpick__name--empty { color: var(--wp-text-dim); }
/* Fixed square so the glyph is centred in it regardless of the glyph's own
 * advance width, and so swapping "no icon" for an icon doesn't reflow. */
.wp-iconpick__slot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 14px;
  line-height: 1;
}
.wp-iconpick__none { color: var(--wp-text-dim); line-height: 1; }
.wp-iconpick__caret { font-size: 10px; color: var(--wp-text-dim); line-height: 1; }
</style>

