<script setup lang="ts">
/**
 * Button: the one button, in the manager, on the canvas and on the
 * community site (WpButton and CloseButton were folded in).
 *
 *   <Button variant="primary" icon="plus">Add module</Button>
 *   <Button variant="ghost" icon="download" aria-label="Download snapshot" />
 *   <Button variant="ghost" icon="times" aria-label="Close" kbd="Esc" @click="close" />
 *   <Button variant="add" icon="plus" size="sm" block>Add rule</Button>
 *   <Button as="a" href="/docs" variant="link">Read the docs</Button>
 *
 * Variants:
 *   primary   solid accent; the main action of a surface
 *   secondary subtle filled; the default
 *   ghost     transparent with a hover fill; tertiary actions, close (×)
 *   danger    red-tinted; destructive actions
 *   link      text only; inline actions
 *   outline   neutral bordered ghost (an accent outline read as a second primary)
 *   add       dashed and quiet: the "Add a row" button at the end of a list
 *
 * Sizes follow the control scale: sm 24 (the canvas) / md 32 (default) / lg 40.
 * `icon` / `iconRight` take a PrimeIcons name, with or without `pi-`.
 *
 * With no slot content it is an icon button (square, `.wp-btn--icon`); give
 * it an `aria-label`, which is also its tooltip (`hint` sets another, `kbd`
 * adds a key chip). Use `hint`, not `v-tooltip` on the component, which would
 * fight the button's own. `pressed` makes it a toggle (aria-pressed, accent
 * tint while on). `block` stretches it to its container.
 *
 * Disabled fades to 45% with a not-allowed cursor and no hover change.
 * Loading keeps the variant's colours, swaps the lead icon for the sparkle,
 * sets aria-busy and ignores clicks.
 *
 * `as="a"` draws a link that looks like a button (pass `href`, `target`…);
 * disabled then sets aria-disabled and takes it out of the tab order.
 *
 * Its stylesheet (`button.css`) is pulled in scoped, so the canvas never
 * carries the `.wp-btn` classes globally; the manager also loads it globally
 * for the few hand-written `.wp-btn` links. Row icon buttons on the canvas
 * are WpIconButton.
 */
import { computed, useSlots } from "vue";
import Icon from "./Icon.vue";
import LoadingMark from "./LoadingMark.vue";
import { vTooltip } from "./tooltip";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "link" | "outline" | "add";
type Size = "sm" | "md" | "lg";

const props = withDefaults(defineProps<{
  variant?: Variant | undefined;
  size?: Size | undefined;
  /** PrimeIcons name ("plus" or "pi-plus"), drawn before the label. */
  icon?: string | undefined;
  /** PrimeIcons name drawn after the label (a chevron, an external link). */
  iconRight?: string | undefined;
  loading?: boolean | undefined;
  disabled?: boolean | undefined;
  /** Stretch to the container's full width. */
  block?: boolean | undefined;
  /** Makes it a toggle (`aria-pressed`): on, it wears the accent tint. */
  pressed?: boolean | undefined;
  type?: "button" | "submit" | "reset" | undefined;
  ariaLabel?: string | undefined;
  /** Tooltip text; an icon button shows its aria-label when this is unset. */
  hint?: string | undefined;
  /** A shortcut shown in the tooltip's key chip, e.g. "Esc". */
  kbd?: string | undefined;
  /** `a` draws a link that looks like a button. */
  as?: "button" | "a" | undefined;
}>(), {
  variant: "secondary",
  size: "md",
  type: "button",
  pressed: undefined,
  icon: undefined,
  iconRight: undefined,
  ariaLabel: undefined,
  hint: undefined,
  kbd: undefined,
  as: "button",
});

const emit = defineEmits<{ click: [evt: MouseEvent] }>();

const slots = useSlots();
const iconOnly = computed(() => !slots.default);
const isLink = computed(() => props.as === "a");
const off = computed(() => Boolean(props.disabled || props.loading));

const classes = computed(() => [
  "wp-btn",
  `wp-btn--${props.variant}`,
  `wp-btn--${props.size}`,
  iconOnly.value && "wp-btn--icon",
  props.block && "wp-btn--block",
]);

const markSize = computed(() => (props.size === "lg" ? 16 : props.size === "md" ? 14 : 12));

function onClick(e: MouseEvent): void {
  if (off.value) {
    // A link can't be disabled natively; stop it following its href.
    if (isLink.value) e.preventDefault();
    return;
  }
  emit("click", e);
}
</script>

<template>
  <component
    :is="as"
    v-tooltip="{ text: hint ?? (iconOnly ? ariaLabel : undefined), kbd }"
    :type="isLink ? undefined : type"
    :class="classes"
    :disabled="isLink ? undefined : off"
    :aria-disabled="isLink && off ? 'true' : undefined"
    :tabindex="isLink && off ? -1 : undefined"
    :aria-label="ariaLabel"
    :aria-busy="loading || undefined"
    :aria-pressed="pressed === undefined ? undefined : pressed"
    @click="onClick"
  >
    <LoadingMark v-if="loading" variant="sparkle" mono :size="markSize" decorative />
    <Icon v-else-if="icon" :name="icon" />
    <span v-if="!iconOnly" class="wp-btn__label"><slot /></span>
    <Icon v-if="iconRight" :name="iconRight" />
  </component>
</template>

<style scoped src="./button.css"></style>
