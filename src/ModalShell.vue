<template>
  <Teleport to="body">
    <Transition name="wp-modal" appear>
      <!-- The overlay is a click target only; keyboard users close with Escape. -->
      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
      <div
        v-if="visible"
        ref="overlayEl"
        class="wp-modal-overlay"
        data-test="modal-backdrop"
        @mousedown="downOnBackdrop = isBackdrop($event)"
        @click="onBackdropClick"
      >
        <div
          ref="wrapperEl"
          class="wp-modal-wrapper"
          role="dialog"
          aria-modal="true"
          :aria-label="label"
          :aria-labelledby="labelledby"
        >
          <slot></slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";
import { useModalKeyShield } from "./useModalKeyShield";

const props = defineProps<{
  visible: boolean;
  /** The dialog's name when it has no visible title. */
  label?: string | undefined;
  /** Id of the element that names the dialog (its title). */
  labelledby?: string | undefined;
}>();
const emit = defineEmits<{
  /** `escape` or `backdrop`, so a dialog can ignore backdrop clicks. */
  (e: "close", reason: "escape" | "backdrop"): void;
  /** Every keydown inside the modal. Consumers MUST use this instead of a
   *  window listener: the shield stops inside-modal keys at the overlay, so a
   *  window listener would never see them. */
  (e: "keydown", ev: KeyboardEvent): void;
}>();

const overlayEl = ref<HTMLElement | null>(null);
const wrapperEl = ref<HTMLElement | null>(null);

/** The overlay or the wrapper around the panel, never the panel's own content. */
function isBackdrop(ev: MouseEvent): boolean {
  return ev.target === overlayEl.value || ev.target === wrapperEl.value;
}
/** Only a press that also STARTED on the backdrop closes: a text selection
 *  dragged out of the dialog ends with a click on the overlay. */
const downOnBackdrop = ref(false);
function onBackdropClick(ev: MouseEvent): void {
  if (downOnBackdrop.value && isBackdrop(ev)) emit("close", "backdrop");
  downOnBackdrop.value = false;
}

function closeOnEscape(event: KeyboardEvent): void {
  if (!props.visible || event.key !== "Escape") return;
  event.preventDefault();
  emit("close", "escape");
}

// Keys pressed INSIDE the modal are handled here and stop at the overlay, so
// they never reach ComfyUI's global shortcuts (see useModalKeyShield).
useModalKeyShield(overlayEl, {
  onKey: (ev) => {
    emit("keydown", ev);
    closeOnEscape(ev);
  },
});

// The window listener still covers the case where focus is OUTSIDE the modal
// — clicking the canvas leaves the modal open but unfocused, and Escape should
// still close it. Events from inside never get here; the shield stops them.
function onKeydown(event: KeyboardEvent) {
  closeOnEscape(event);
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) window.addEventListener("keydown", onKeydown);
    else window.removeEventListener("keydown", onKeydown);
  },
  { immediate: true },
);

onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<style>
@import "./_modal-motion.css";
</style>

<style scoped>
.wp-modal-overlay,
.wp-modal-overlay * {
  box-sizing: border-box;
}
.wp-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--wp-overlay-bg, rgba(0, 0, 0, 0.62));
  font-family: var(--wp-font-sans, sans-serif);
  cursor: default;
}
.wp-modal-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  max-height: 100%;
}

/* `wp-modal` open/close transition lives in
 * src/components/shared/_modal-motion.css (imported globally via
 * ContextWidget) so every modal — ModalShell consumers (Modal, ConfirmModal),
 * InjectorBindingModal — animates with the same rules. */
</style>
