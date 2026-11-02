<script setup lang="ts">
/**
 * A panel anchored to a trigger: opens below it (or wherever `placement`
 * says), flips and stays on screen, follows the trigger on scroll and
 * resize, and closes on Escape or a click outside, giving focus back to
 * the trigger. Works on the canvas and in the manager. Anything that
 * floats next to a control builds on this instead of its own Teleport.
 *
 *   <Popover v-model:open="open" label="Category colour">
 *     <template #trigger="{ props }"><Button v-bind="props">Colour</Button></template>
 *     …panel content…
 *   </Popover>
 *
 * One panel shared by many triggers (the cells of a rule grid) passes the
 * element it belongs to as `anchor` instead of a trigger slot; clicks on that
 * element don't count as outside, so it can toggle the panel itself.
 *
 *   <Popover :open="!!cell" :anchor="cell?.el" label="Cell rule" @update:open="cell = null">…</Popover>
 *
 * `variant="menu"` draws the panel as a menu (`menu.css`, the look Select's
 * list, ContextMenu and Combobox share): tighter padding, 4px from the
 * trigger, above modals, and it closes once its trigger scrolls out of view.
 * Every panel is capped at `maxHeight` and at the room on its side, and
 * scrolls past that instead of covering its trigger.
 */
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from "vue";
import { placeFloating, roomOn, viewportSize, type Placement, type Side } from "./floating";
import { provideFloatingLayer, useFloatingChild } from "./floating-layer";

const props = withDefaults(defineProps<{
  open: boolean;
  placement?: Placement | undefined;
  /** The panel's name for screen readers. */
  label?: string | undefined;
  /** Make the panel at least as wide as the trigger (lists under a field). */
  matchWidth?: boolean | undefined;
  /** Move focus into the panel when it opens. Off for panels you type past. */
  autofocus?: boolean | undefined;
  /** "dialog" for panels with controls, "menu"/"listbox" when the content is one. */
  role?: "dialog" | "menu" | "listbox" | "group" | undefined;
  /** Place the panel against this element instead of the trigger slot. */
  anchor?: HTMLElement | null | undefined;
  /** "menu" for a list of choices (Select, Combobox): the shared menu look. */
  variant?: "panel" | "menu" | undefined;
  /** Tallest the panel grows, in px, before it scrolls. */
  maxHeight?: number | undefined;
}>(), { placement: "bottom-start", autofocus: true, role: "dialog", anchor: null, variant: "panel" });

const emit = defineEmits<{ (e: "update:open", v: boolean): void }>();

const id = `wp-popover-${useId()}`;
const anchorEl = ref<HTMLElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);
const pos = ref<{ x: number; y: number; side: Side; minWidth?: number | undefined; maxHeight?: number | undefined }>({ x: -9999, y: -9999, side: "bottom" });
const isMenu = computed(() => props.variant === "menu");
/** A short panel still shows a few rows when the room on both sides is tight. */
const MIN_HEIGHT = 80;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), '
  + 'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trigger(): HTMLElement | null {
  if (props.anchor) return props.anchor;
  const el = anchorEl.value;
  return (el?.firstElementChild as HTMLElement | null) ?? el;
}

function setOpen(v: boolean): void {
  if (v !== props.open) emit("update:open", v);
}

const triggerProps = computed(() => ({
  "aria-haspopup": (props.role === "group" ? "true" : props.role) as "true" | "dialog" | "menu" | "listbox",
  "aria-expanded": props.open,
  "aria-controls": props.open ? id : undefined,
  onClick: () => setOpen(!props.open),
}));

function place(): void {
  const t = trigger();
  const p = panelEl.value;
  if (!t || !p) return;
  const r = t.getBoundingClientRect();
  const view = viewportSize();
  const opts = { placement: props.placement, gap: isMenu.value ? 4 : 6 };
  const width = Math.max(p.offsetWidth, props.matchWidth ? r.width : 0);
  // The content's own height (scrollHeight ignores the cap set last time),
  // so a panel that was squeezed can grow back when there is room again.
  const borders = p.offsetHeight - p.clientHeight;
  const natural = Math.min(p.scrollHeight + borders, props.maxHeight ?? Infinity);
  const first = placeFloating(r, { width, height: natural }, view, opts);
  const fits = Math.max(MIN_HEIGHT, roomOn(first.side, r, view, opts));
  const height = Math.min(natural, fits);
  const at = height < natural ? placeFloating(r, { width, height }, view, opts) : first;
  pos.value = {
    ...at,
    minWidth: props.matchWidth ? r.width : undefined,
    maxHeight: Math.min(props.maxHeight ?? Infinity, fits),
  };
}

/** True once no part of the trigger is on screen. */
function triggerGone(): boolean {
  const t = trigger();
  if (!t) return false;
  const r = t.getBoundingClientRect();
  const view = viewportSize();
  return r.bottom < 0 || r.top > view.height || r.right < 0 || r.left > view.width;
}

function onScroll(ev: Event): void {
  // The panel's own scrolling changes nothing about where it sits.
  if (ev.target instanceof Node && panelEl.value?.contains(ev.target)) return;
  // A menu whose trigger has scrolled away has nothing left to follow.
  if (isMenu.value && triggerGone()) { setOpen(false); return; }
  place();
}

// A Select list, menu or Popover opened from inside this panel is part of it.
const layer = provideFloatingLayer();
// And this panel is part of a Popover it was opened from.
useFloatingChild(() => (props.open ? panelEl.value : null));

function onPointerDown(ev: PointerEvent): void {
  const path = ev.composedPath();
  if (layer.owns(path)) return;
  if (panelEl.value && path.includes(panelEl.value)) return;
  if (anchorEl.value && path.includes(anchorEl.value)) return;
  if (props.anchor && path.includes(props.anchor)) return;
  setOpen(false);
}

function onKeydown(ev: KeyboardEvent): void {
  if (ev.key !== "Escape") return;
  // An open list or menu inside the panel shuts first, on its own handler.
  if (layer.childOpen()) return;
  ev.preventDefault();
  ev.stopPropagation();
  setOpen(false);
  trigger()?.focus();
}

function listen(on: boolean): void {
  const m = on ? "addEventListener" : "removeEventListener";
  window[m]("pointerdown", onPointerDown as EventListener, true);
  window[m]("keydown", onKeydown as EventListener, true);
  window[m]("resize", place);
  window[m]("scroll", onScroll, true);
}

watch(() => props.open, async (v) => {
  if (typeof window === "undefined") return;
  listen(v);
  if (!v) return;
  await nextTick();
  place();
  if (props.autofocus && panelEl.value && !panelEl.value.contains(document.activeElement)) {
    (panelEl.value.querySelector<HTMLElement>(FOCUSABLE) ?? panelEl.value).focus();
  }
}, { immediate: true });

// A shared panel moving to another trigger re-places without closing.
watch(() => props.anchor, () => { if (props.open) void nextTick(place); });

onBeforeUnmount(() => { if (typeof window !== "undefined") listen(false); });

defineExpose({ place });
</script>

<template>
  <span v-if="$slots.trigger" ref="anchorEl" class="wp-popover-anchor">
    <slot name="trigger" :props="triggerProps" :open="open" />
  </span>
  <Teleport to="body">
    <div
      v-if="open"
      :id="id"
      ref="panelEl"
      class="wp-popover"
      :class="{ 'wp-menu': isMenu }"
      :data-side="pos.side"
      :data-variant="variant"
      :role="role"
      :aria-label="label"
      tabindex="-1"
      :style="{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        minWidth: pos.minWidth ? `${pos.minWidth}px` : undefined,
        maxHeight: pos.maxHeight !== undefined && Number.isFinite(pos.maxHeight) ? `${pos.maxHeight}px` : undefined,
      }"
    >
      <slot :close="() => setOpen(false)" />
    </div>
  </Teleport>
</template>

<style scoped src="./menu.css"></style>

<style>
@layer wp-extension {
  .wp-popover-anchor { display: inline-flex; }
  .wp-popover {
    position: fixed;
    z-index: 10000;
    max-width: min(420px, calc(100vw - 16px));
    max-height: calc(100vh - 16px);
    overflow: auto;
    padding: calc(var(--wp-space-3) + 1px); /* plus the 1px the ring stands in for */
    background: var(--wp-bg-2);
    color: var(--wp-text);
    /* The outline is an inset ring, not a border: these rules are layered, and
       a host's unlayered reset (Tailwind 3's preflight sets border-width: 0
       on every element) would beat a border. Nothing resets box-shadow. */
    border: 0;
    border-radius: var(--wp-radius);
    box-shadow: inset 0 0 0 1px var(--wp-border-strong), var(--wp-shadow-md);
    font-family: var(--wp-font-sans);
    font-size: var(--wp-text-sm);
    outline: none;
    animation: wp-popover-in 120ms ease-out;
  }
  @keyframes wp-popover-in {
    from { opacity: 0; transform: translateY(-2px); }
  }
  /* A menu is as wide as its longest row (up to 620px), not a 420px panel. */
  .wp-popover[data-variant="menu"] { max-width: min(620px, calc(100vw - 16px)); }
  .wp-popover[data-side="top"] { animation-name: wp-popover-in-up; }
  @keyframes wp-popover-in-up {
    from { opacity: 0; transform: translateY(2px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .wp-popover { animation: none; }
  }
}
</style>
