<script setup lang="ts">
/**
 * The one checkbox, for the manager, the community site and canvas widgets.
 *
 *   <Checkbox v-model="picked" label="Include in bundle" />
 *   <Checkbox v-model="on" size="sm" aria-label="Enabled" />           a row's box
 *   <Checkbox :model-value="false" indeterminate label="Some selected" />
 *   <Checkbox v-model="favorites" field label="Favorites only" />
 *
 * Box: a `<button role="checkbox">`, so a wrapping `<label>` ticks it like an
 * input. Click, Space and Enter toggle. `size="sm"` is the 14px box of the
 * canvas rows' on/off mark; md is 16px (ComfyUI's own box). Either takes a
 * 24px click around it, so a lone box is as easy to hit as a native row. A parent can tint the checked fill
 * with `--check-on` (a bundle header uses its bundle colour).
 *
 * Without a label the box is the root: `class`, `title`, `data-test` and a
 * parent's scoped styles land on it. With a label (prop or the default slot)
 * or `field`, the root is a wrapper around the box and the words, and a click
 * on the words toggles too.
 *
 * The styles are scoped and read only SHARED_TOKENS, so the box ships in the
 * canvas chunk and wears each side's colours.
 */
import { computed, useAttrs, useId, useSlots } from "vue";

defineOptions({ inheritAttrs: false });

interface Props {
  /** Checked state: use with `v-model` or `:model-value` + `@update:model-value`. */
  modelValue?: boolean | undefined;
  label?: string | undefined;
  disabled?: boolean | undefined;
  error?: boolean | undefined;
  id?: string | undefined;
  ariaLabel?: string | undefined;
  size?: "sm" | "md" | undefined;
  /**
   * Tri-state indicator. When true AND `modelValue` is false, the box shows a
   * dash and announces `aria-checked="mixed"` (a select-all over a partial
   * selection). `modelValue=true` always wins.
   */
  indeterminate?: boolean | undefined;
  /**
   * Draw the whole row as an input-height field (border, fill, full width)
   * whose label fills it, for a yes/no filter in a form grid beside Selects
   * (the list pages' "Favorites only").
   */
  field?: boolean | undefined;
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  label: undefined,
  disabled: false,
  error: false,
  id: undefined,
  ariaLabel: undefined,
  size: "md",
  indeterminate: false,
  field: false,
});

const emit = defineEmits<{ "update:modelValue": [next: boolean] }>();

const attrs = useAttrs();
const slots = useSlots();
const labelId = useId();

const hasLabel = computed(() => !!props.label || !!slots.default);
/** The wrapper is a real box (label beside the box, or the field look). */
const wrapped = computed(() => hasLabel.value || props.field);
const showIndeterminate = computed(() => props.indeterminate && !props.modelValue);
const ariaChecked = computed<"true" | "false" | "mixed">(() => {
  if (props.modelValue) return "true";
  return showIndeterminate.value ? "mixed" : "false";
});

function toggle(): void {
  if (props.disabled) return;
  emit("update:modelValue", !props.modelValue);
}
</script>

<template>
  <span
    v-if="wrapped"
    v-bind="attrs"
    class="wp-checkbox"
    :class="[`wp-checkbox--${size}`, { 'wp-checkbox--field': field, 'is-disabled': disabled }]"
  >
    <!-- With a label the root is a <span>, not a <label>: a native label
         re-dispatches the click on its control in some pointer paths (a click
         on the tick SVG), which toggled twice and left the model unchanged.
         No comment sits beside the roots: it would make the root a fragment. -->
    <button
      :id="id"
      :aria-label="ariaLabel ?? label"
      :aria-labelledby="!ariaLabel && !label ? labelId : undefined"
      type="button"
      role="checkbox"
      class="wp-check"
      :class="{ 'wp-check--sm': size === 'sm' }"
      :data-checked="modelValue ? 'true' : 'false'"
      :data-indeterminate="showIndeterminate ? 'true' : 'false'"
      :aria-checked="ariaChecked"
      :aria-invalid="error || undefined"
      :aria-disabled="disabled || undefined"
      :disabled="disabled"
      @click="toggle"
      @keydown.enter.prevent="toggle"
    >
      <!-- No inline style on the marks: the TUI look hides them (it writes
           [x] / [-]) and an inline display would beat that rule. -->
      <svg v-if="modelValue" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M3 6.2l2.2 2.2L9 4.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <svg v-else-if="showIndeterminate" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M3 6h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    </button>
    <!-- A click on the words toggles too, like a <label>; keyboard users use the box itself. -->
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
    <span :id="labelId" class="wp-checkbox__label" @click="toggle"><slot>{{ label }}</slot></span>
  </span>
  <button
    v-else
    v-bind="attrs"
    :id="id"
    :aria-label="ariaLabel"
    type="button"
    role="checkbox"
    class="wp-check"
    :class="{ 'wp-check--sm': size === 'sm' }"
    :data-checked="modelValue ? 'true' : 'false'"
    :data-indeterminate="showIndeterminate ? 'true' : 'false'"
    :aria-checked="ariaChecked"
    :aria-invalid="error || undefined"
    :aria-disabled="disabled || undefined"
    :disabled="disabled"
    @click="toggle"
    @keydown.enter.prevent="toggle"
  >
    <!-- Box only: the box is the root, so the caller's class, scoped styles,
         title and data-test land on it. -->
    <svg v-if="modelValue" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 6.2l2.2 2.2L9 4.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <svg v-else-if="showIndeterminate" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 6h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg>
  </button>
</template>

<style scoped>
/* State selectors sit in :where() so every rule stays at the base box's
 * weight: the looks (theme/looks.css: TUI's [x], Soft's round corners) are
 * one notch heavier and win, as they did over the old global sheet. */
.wp-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: var(--wp-control-h-md);
  color: var(--wp-text);
  font: var(--wp-text-sm) / 1.3 var(--wp-font-sans);
  cursor: pointer;
  user-select: none;
}
.wp-checkbox--sm { gap: 6px; min-height: var(--wp-control-h-sm); font-size: var(--wp-text-xs); }
.wp-checkbox:where(.is-disabled) { cursor: not-allowed; }
.wp-checkbox:where(.is-disabled) .wp-checkbox__label { opacity: 0.5; }

.wp-check {
  appearance: none;
  box-sizing: border-box;
  position: relative;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  /* A visible edge on the empty box: the hairline border tokens vanish on a dark row. */
  border: 1.5px solid color-mix(in srgb, var(--wp-text-dim) 70%, transparent);
  border-radius: min(3px, var(--wp-radius-cap, 999px));
  background: var(--wp-bg);
  color: transparent;
  font: inherit;
  line-height: 0;
  cursor: pointer;
  transition: background var(--wp-motion-quick), border-color var(--wp-motion-quick), color var(--wp-motion-quick);
}
.wp-check svg { width: 10px; height: 10px; display: block; pointer-events: none; }
/* The click reaches 24 x 24 around the box (::before is the TUI look's [x]). */
.wp-check::after { content: ""; position: absolute; inset: -4px; }
.wp-check--sm { width: 14px; height: 14px; border-width: 1px; border-radius: min(2px, var(--wp-radius-cap, 999px)); }
.wp-check--sm::after { inset: -5px; }
.wp-check--sm svg { width: 8px; height: 8px; }
.wp-check:focus-visible { outline: none; box-shadow: var(--wp-focus-ring); }
.wp-check:where(:not(:disabled, [aria-checked="true"], [aria-checked="mixed"]):hover) { border-color: var(--wp-accent-500); }
.wp-check:where([aria-invalid="true"]) { border-color: var(--wp-error-border); }
/* accent-600 under a white mark: ≥ 4.5:1 in both themes. */
.wp-check:where([aria-checked="true"], [aria-checked="mixed"]) {
  background: var(--check-on, var(--wp-accent-600));
  border-color: var(--check-on, var(--wp-accent-500));
  color: var(--wp-on-accent);
}
/* Disabled: grey, so a ticked disabled box doesn't read as a live one. */
.wp-check:where(:disabled) {
  cursor: not-allowed;
  background: var(--wp-bg-3);
  border-color: var(--wp-border);
  opacity: 0.6;
}
.wp-check:where(:disabled[aria-checked="true"], :disabled[aria-checked="mixed"]) {
  background: var(--wp-text-dim);
  border-color: var(--wp-text-dim);
  color: var(--wp-bg-1);
}

/* Field look: an input-height box in a form grid. The label fills it, so a
 * click anywhere toggles once (the label toggles, the box toggles). */
.wp-checkbox--field {
  display: flex;
  width: 100%;
  height: var(--wp-control-h-md);
  box-sizing: border-box;
  gap: 0;
  background: var(--wp-bg-2);
  border: 1px solid var(--wp-border);
  border-radius: var(--wp-radius-sm);
  transition: border-color var(--wp-motion-quick);
}
.wp-checkbox--field.wp-checkbox--sm { height: var(--wp-control-h-sm); }
.wp-checkbox--field:hover { border-color: var(--wp-border-strong); }
.wp-checkbox--field:focus-within { border-color: var(--wp-accent-500); }
.wp-checkbox--field .wp-check { margin-left: 10px; }
.wp-checkbox--field .wp-checkbox__label {
  flex: 1;
  align-self: stretch;
  display: flex;
  align-items: center;
  padding: 0 10px 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (prefers-reduced-motion: reduce) {
  .wp-check, .wp-checkbox--field { transition: none; }
}
</style>
