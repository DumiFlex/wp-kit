<script setup lang="ts">
/**
 * Modal: the one dialog, in the manager, on the canvas and on the community
 * site. A titled panel (header with ×, body, optional footer) on ModalShell,
 * so it gets the shared overlay, open/close motion and the key shield that
 * keeps typing away from ComfyUI's shortcuts; useDialogFocus adds the focus
 * trap and focus return.
 *
 *   <Modal v-model:open="open" title="Rename module">…<template #footer>…</template></Modal>
 *
 * Escape, the × and the backdrop close it (`close-on-backdrop="false"` keeps
 * a backdrop click from closing a form that would lose work). A custom
 * `#header` puts `:id="titleId"` on its own heading. `keydown` gives every key
 * pressed inside (the shield stops them before `window`), so a dialog's own
 * keys go there, not on a window listener. ConfirmModal is built on it.
 *
 * `accent` (any CSS colour, e.g. `var(--wp-kind-wildcard)`) tints the header
 * (`"brand"` lays a soft wash of the brand gradient instead, as the pickers have)
 * with that colour and shows `icon` in it; header slot content can read it as
 * `--wp-modal-accent` (a chip naming what is edited). `flush` drops the body's
 * padding for content made of its own padded sections.
 *
 * The panel styles are scoped and read only shared tokens, so it wears the
 * colours of whichever side it is on.
 */
import { ref, useId, useSlots } from "vue";
import Button from "./Button.vue";
import ModalShell from "./ModalShell.vue";
import { useDialogFocus } from "./useDialogFocus";

const props = withDefaults(defineProps<{
  open: boolean;
  title?: string | undefined;
  size?: "sm" | "md" | "lg" | undefined;
  closeOnBackdrop?: boolean | undefined;
  /** A CSS colour that tints the header and colours `icon`; `"brand"` for the brand-gradient wash. */
  accent?: string | undefined;
  /** PrimeIcons name (without `pi-`) shown at the header's start. */
  icon?: string | undefined;
  /** No body padding: the content brings its own. */
  flush?: boolean | undefined;
}>(), { size: "md", closeOnBackdrop: true, title: undefined, accent: undefined, icon: undefined, flush: false });

const emit = defineEmits<{
  (e: "update:open", v: boolean): void;
  /** Every keydown inside the dialog. */
  (e: "keydown", ev: KeyboardEvent): void;
}>();

const slots = useSlots();
const dialog = ref<HTMLElement | null>(null);
const titleId = `wp-modal-title-${useId()}`;

function close(): void {
  emit("update:open", false);
}

function onShellClose(reason: "escape" | "backdrop"): void {
  if (reason === "backdrop" && !props.closeOnBackdrop) return;
  close();
}

const focus = useDialogFocus(dialog, () => props.open, {
  // ModalShell closes on Escape; the shield stops keys before window, so the
  // trap runs from the shell's keydown (below), not a window listener.
  onEscape: () => undefined,
  window: false,
  // The first control in the body, else the dialog itself (the close button
  // would make Enter close it).
  initial: (root, els) => {
    const body = root.querySelector(".wp-modal__body");
    return els.find((el) => body?.contains(el)) ?? root;
  },
});

function onKeydown(ev: KeyboardEvent): void {
  focus.onKeydown(ev);
  emit("keydown", ev);
}
</script>

<template>
  <ModalShell
    :visible="open"
    :labelledby="title || slots.header ? titleId : undefined"
    @close="onShellClose"
    @keydown="onKeydown"
  >
    <div
      ref="dialog"
      class="wp-modal"
      :class="[`wp-modal--${size}`, { 'wp-modal--accent': !!accent && accent !== 'brand', 'wp-modal--brand': accent === 'brand' }]"
      :style="accent ? { '--wp-modal-accent': accent === 'brand' ? 'var(--wp-accent)' : accent } : undefined"
      tabindex="-1"
      data-test="modal"
    >
      <header v-if="title || slots.header" class="wp-modal__head">
        <i v-if="icon" class="pi wp-modal__icon" :class="`pi-${icon}`" aria-hidden="true" />
        <h3 v-if="title" :id="titleId" class="wp-modal__title">{{ title }}</h3>
        <slot name="header" :title-id="titleId" />
        <span class="wp-modal__spacer" />
        <Button variant="ghost" icon="times" aria-label="Close" kbd="Esc" data-test="modal-close" @click="close" />
      </header>
      <div class="wp-modal__body" :class="{ 'wp-modal__body--flush': flush }">
        <slot />
      </div>
      <footer v-if="slots.footer" class="wp-modal__foot">
        <slot name="footer" />
      </footer>
    </div>
  </ModalShell>
</template>

<style scoped>
.wp-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 560px;
  max-height: calc(100vh - 48px);
  overflow: hidden;
  background: var(--wp-bg-2);
  border: 1px solid var(--wp-border);
  border-radius: var(--wp-radius-lg);
  box-shadow: var(--wp-shadow-xl);
  color: var(--wp-text);
  font-family: var(--wp-font-sans);
  font-size: var(--wp-text-base);
}
/* The dialog takes focus only when nothing in it can. */
.wp-modal:focus { outline: none; }
.wp-modal--sm { max-width: 380px; }
.wp-modal--md { max-width: 560px; }
.wp-modal--lg { max-width: 880px; }
.wp-modal__head {
  display: flex;
  align-items: center;
  gap: var(--wp-space-4);
  padding: var(--wp-space-4) var(--wp-space-5);
  border-bottom: 1px solid var(--wp-border);
  background: var(--wp-bg);
}
.wp-modal--accent .wp-modal__head {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--wp-modal-accent) 18%, var(--wp-bg-2)) 0%,
    var(--wp-bg-2) 100%
  );
}
/* The brand wash: the gradient under an 85% veil of the page colour. */
.wp-modal--brand .wp-modal__head {
  background:
    linear-gradient(color-mix(in srgb, var(--wp-bg) 85%, transparent), color-mix(in srgb, var(--wp-bg) 85%, transparent)),
    var(--wp-brand-gradient);
}
.wp-modal__icon { flex: none; width: 24px; text-align: center; font-size: 18px; color: var(--wp-modal-accent, var(--wp-accent)); }
.wp-modal__title { flex: 1; margin: 0; font-size: var(--wp-text-md); font-weight: 600; color: var(--wp-text); }
.wp-modal__spacer { flex: 1; }
.wp-modal__title + .wp-modal__spacer { display: none; }
.wp-modal__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--wp-space-5);
}
.wp-modal__body--flush { padding: 0; }
.wp-modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: var(--wp-space-3);
  padding: var(--wp-space-4) var(--wp-space-5);
  border-top: 1px solid var(--wp-border);
  background: var(--wp-bg);
}
@media (max-width: 640px) {
  .wp-modal__head, .wp-modal__body, .wp-modal__body--flush { padding: 0; }
.wp-modal__foot { padding-left: var(--wp-space-5); padding-right: var(--wp-space-5); }
}
</style>
