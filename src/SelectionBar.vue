<script setup lang="ts">
/**
 * SelectionBar: the bar over a list while rows are ticked. "3 selected", the
 * bulk actions (the default slot) and Clear. One bar for every list: the
 * editors' bulk mode, the moderation queue, a backups list.
 *
 *   <SelectionBar v-if="picked.size" :count="picked.size" @clear="picked.clear()">
 *     <Button variant="danger" size="sm" icon="trash" @click="del">Delete</Button>
 *   </SelectionBar>
 *
 * `#start` sits right after the count (a filter, an option), the default slot
 * on the right before Clear. `sticky` keeps it at the top of its scroll area
 * while the list scrolls under it (`--wp-selection-bar-top` moves it below a
 * fixed header). `noun` says what is selected ("3 options selected");
 * `noun-one` is its singular for a count of 1 ("1 option selected"), by
 * default the noun without its last "s". Escape
 * inside the bar clears, like Clear; the count is read out as it changes.
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Button from "./Button.vue";

const props = withDefaults(defineProps<{
  count: number;
  /** What a row is, plural ("options"); left out it says "3 selected". */
  noun?: string | undefined;
  /** The noun for one row ("option"); defaults to `noun` without its last "s". */
  nounOne?: string | undefined;
  /** Stick to the top of the scroll area. */
  sticky?: boolean | undefined;
  /** Hide the Clear button (the host clears another way). */
  hideClear?: boolean | undefined;
  clearLabel?: string | undefined;
  /** The toolbar's accessible name. */
  label?: string | undefined;
}>(), { noun: undefined, nounOne: undefined, clearLabel: "Clear", label: "Bulk actions" });

const emit = defineEmits<{ clear: [] }>();

/** "3 options selected", "1 option selected", or "3 selected" with no noun. */
const countText = computed(() => {
  if (!props.noun) return `${props.count} selected`;
  const one = props.nounOne ?? props.noun.replace(/s$/, "");
  return `${props.count} ${props.count === 1 ? one : props.noun} selected`;
});

function onKeydown(ev: KeyboardEvent): void {
  if (ev.key !== "Escape" || props.hideClear) return;
  ev.stopPropagation();
  emit("clear");
}

// Bound in code, not as @keydown: the bar is a toolbar of buttons, and the
// keys come from those buttons (a template handler on it reads to the a11y
// lint as a click target on a plain element).
const root = ref<HTMLElement | null>(null);
onMounted(() => root.value?.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => root.value?.removeEventListener("keydown", onKeydown));
</script>

<template>
  <div
    ref="root"
    class="wp-selbar"
    role="toolbar"
    :aria-label="label"
    :data-sticky="sticky || undefined"
    data-test="selection-bar"
  >
    <span class="wp-selbar__count" aria-live="polite" data-test="selection-count">{{ countText }}</span>
    <slot name="start" />
    <span class="wp-selbar__spacer" />
    <slot />
    <Button v-if="!hideClear" variant="ghost" size="sm" data-test="selection-clear" @click="emit('clear')">{{ clearLabel }}</Button>
  </div>
</template>

<style scoped>
.wp-selbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--wp-space-4);
  padding: var(--wp-space-3) var(--wp-space-5);
  border: 1px solid color-mix(in oklab, var(--wp-accent) 40%, transparent);
  border-radius: min(8px, var(--wp-radius-cap, 999px));
  background: color-mix(in oklab, var(--wp-accent) 12%, var(--wp-bg-2));
  font-family: var(--wp-font-sans);
}
.wp-selbar[data-sticky] {
  position: sticky;
  top: var(--wp-selection-bar-top, 0px);
  z-index: 20;
}
.wp-selbar__count {
  font-size: var(--wp-text-base);
  font-weight: 600;
  color: var(--wp-text);
  white-space: nowrap;
}
.wp-selbar__spacer { flex: 1; }
</style>
