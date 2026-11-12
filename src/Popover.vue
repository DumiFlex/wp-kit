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
 * A list that follows the text caret, or a card opened at a point, passes a
 * virtual anchor instead: anything with `getBoundingClientRect()` (see
 * `VirtualAnchor` in floating.ts). Hand it a new object to move the panel.
 *
 *   <Popover :open="!!at" :anchor="at" :autofocus="false" role="listbox" @update:open="at = null">…</Popover>
 *
 * Attributes (`class`, `data-test`, `@mouseenter` …) go on the panel, so a
 * hover card can keep itself open while the pointer is over it.
 *
 * `trigger="hover"` makes it a hover card: it opens after `openDelay` ms
 * with the pointer (or focus) on the trigger, and closes `closeDelay` ms
 * after the pointer leaves both the trigger and the card, so the pointer can
 * cross the gap into the card. A click still toggles it (touch screens), and
 * Escape and a click outside still close it. A hover card doesn't take focus.
 * With an `anchor` element the same listeners go on that element; with a
 * virtual anchor the caller opens it and the card's own hover keeps it open.
 *
 *   <Popover v-model:open="open" trigger="hover" label="Reference">
 *     <template #trigger="{ props }"><Chip v-bind="props">@{a1b2c3d4}</Chip></template>
 *     …card…
 *   </Popover>
 *
 * `variant="menu"` draws the panel as a menu (`menu.css`, the look Select's
 * list, ContextMenu and Combobox share): tighter padding, 4px from the
 * trigger, above modals, and it closes once its trigger scrolls out of view.
 * Every panel is capped at `maxHeight` and at the room on its side, and
 * scrolls past that instead of covering its trigger.
 */
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from "vue";
import { placeFloating, roomOn, viewportSize, type Placement, type Side, type VirtualAnchor } from "./floating";
import { provideFloatingLayer, useFloatingChild } from "./floating-layer";
import { vBarRoom } from "./overlay-scrollbars";

defineOptions({ inheritAttrs: false });

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
  /** Place the panel against this element (or a virtual anchor: a caret, a
   *  point) instead of the trigger slot. */
  anchor?: HTMLElement | VirtualAnchor | null | undefined;
  /** "menu" for a list of choices (Select, Combobox): the shared menu look. */
  variant?: "panel" | "menu" | undefined;
  /** Tallest the panel grows, in px, before it scrolls. */
  maxHeight?: number | undefined;
  /** "hover" opens it as a hover card (see above). */
  trigger?: "click" | "hover" | undefined;
  /** Hover card: ms with the pointer on the trigger before it opens. */
  openDelay?: number | undefined;
  /** Hover card: ms after the pointer leaves before it closes. */
  closeDelay?: number | undefined;
}>(), { placement: "bottom-start", autofocus: undefined, role: "dialog", anchor: null, variant: "panel", trigger: "click", openDelay: 280, closeDelay: 160 });

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

/** What the panel is placed against: the anchor prop or the trigger slot. */
function trigger(): HTMLElement | VirtualAnchor | null {
  if (props.anchor) return props.anchor;
  const el = anchorEl.value;
  return (el?.firstElementChild as HTMLElement | null) ?? el;
}

/** The anchor as an element, when it is one (a virtual anchor takes no focus). */
function anchorElement(): HTMLElement | null {
  const a = props.anchor;
  return a instanceof HTMLElement ? a : null;
}

function setOpen(v: boolean): void {
  clearHoverTimer();
  if (v !== props.open) emit("update:open", v);
}

const isHover = computed(() => props.trigger === "hover");
/** A hover card leaves focus where it is unless asked otherwise. */
const takesFocus = computed(() => props.autofocus ?? !isHover.value);

let hoverTimer: ReturnType<typeof setTimeout> | undefined;
function clearHoverTimer(): void {
  if (hoverTimer !== undefined) clearTimeout(hoverTimer);
  hoverTimer = undefined;
}
/** Pointer or focus came onto the trigger or the card. */
function hoverIn(): void {
  if (!isHover.value) return;
  clearHoverTimer();
  if (props.open) return;
  hoverTimer = setTimeout(() => { hoverTimer = undefined; setOpen(true); }, props.openDelay);
}
/** Pointer or focus left the trigger or the card. */
function hoverOut(): void {
  if (!isHover.value) return;
  clearHoverTimer();
  if (!props.open) return;
  hoverTimer = setTimeout(() => { hoverTimer = undefined; setOpen(false); }, props.closeDelay);
}
/** Focus moving between the trigger's own children isn't leaving it. */
function focusOut(ev: FocusEvent): void {
  const to = ev.relatedTarget;
  if (to instanceof Node && ((ev.currentTarget as Node | null)?.contains(to) || panelEl.value?.contains(to))) return;
  hoverOut();
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
  const bottom = r.top + r.height;
  const right = r.left + r.width;
  return bottom < 0 || r.top > view.height || right < 0 || r.left > view.width;
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

// A hover card on an `anchor` element listens on that element.
function hoverListen(el: HTMLElement, on: boolean): void {
  const m = on ? "addEventListener" : "removeEventListener";
  el[m]("mouseenter", hoverIn);
  el[m]("mouseleave", hoverOut);
  el[m]("focusin", hoverIn);
  el[m]("focusout", focusOut as EventListener);
}
watch(() => (isHover.value ? anchorElement() : null), (el, old) => {
  if (old) hoverListen(old, false);
  if (el) hoverListen(el, true);
}, { immediate: true });
// And this panel is part of a Popover it was opened from.
useFloatingChild(() => (props.open ? panelEl.value : null));

function onPointerDown(ev: PointerEvent): void {
  const path = ev.composedPath();
  if (layer.owns(path)) return;
  if (panelEl.value && path.includes(panelEl.value)) return;
  if (anchorEl.value && path.includes(anchorEl.value)) return;
  const own = anchorElement();
  if (own && path.includes(own)) return;
  setOpen(false);
}

function onKeydown(ev: KeyboardEvent): void {
  if (ev.key !== "Escape") return;
  // An open list or menu inside the panel shuts first, on its own handler.
  if (layer.childOpen()) return;
  ev.preventDefault();
  ev.stopPropagation();
  setOpen(false);
  const t = trigger();
  if (t instanceof HTMLElement) t.focus();
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
  if (takesFocus.value && panelEl.value && !panelEl.value.contains(document.activeElement)) {
    (panelEl.value.querySelector<HTMLElement>(FOCUSABLE) ?? panelEl.value).focus();
  }
}, { immediate: true });

// A shared panel moving to another trigger re-places without closing.
watch(() => props.anchor, () => { if (props.open) void nextTick(place); });

onBeforeUnmount(() => {
  clearHoverTimer();
  const el = anchorElement();
  if (el) hoverListen(el, false);
  if (typeof window !== "undefined") listen(false);
});

defineExpose({ place });
</script>

<template>
  <!-- Hover-card listeners only watch the pointer and focus; the trigger
       inside is the control and keeps its own click and keys. -->
  <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
  <span
    v-if="$slots.trigger"
    ref="anchorEl"
    class="wp-popover-anchor"
    @mouseenter="hoverIn"
    @mouseleave="hoverOut"
    @focusin="hoverIn"
    @focusout="focusOut"
  >
    <slot name="trigger" :props="triggerProps" :open="open" />
  </span>
  <Teleport to="body">
    <!-- The panel has its role; the hover listeners keep a hover card open. -->
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
    <div
      v-if="open"
      :id="id"
      ref="panelEl"
      v-bar-room
      class="wp-popover"
      :class="{ 'wp-menu': isMenu }"
      :data-side="pos.side"
      :data-variant="variant"
      :role="role"
      :aria-label="label"
      tabindex="-1"
      v-bind="$attrs"
      :style="{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        minWidth: pos.minWidth ? `${pos.minWidth}px` : undefined,
        maxHeight: pos.maxHeight !== undefined && Number.isFinite(pos.maxHeight) ? `${pos.maxHeight}px` : undefined,
      }"
      @mouseenter="hoverIn"
      @mouseleave="hoverOut"
      @focusin="hoverIn"
      @focusout="focusOut"
    >
      <slot :close="() => setOpen(false)" />
    </div>
  </Teleport>
</template>

<style scoped src="./menu.css"></style>

<style>
@layer wp-extension {
  .wp-popover-anchor { display: inline-flex; }
  /* An overlay scrollbar (Firefox, macOS) is drawn over the content otherwise. */
  .wp-popover[data-wp-bar~="y"] { padding-inline-end: calc(var(--wp-space-3) + 1px + var(--wp-bar-room, 0px)); }
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
