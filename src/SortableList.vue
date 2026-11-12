<script setup lang="ts" generic="T">
/**
 * Sortable list: rows you put in order by dragging their grip, or from the
 * keyboard. Works on the canvas (`size="sm"`) and in the manager (`md`).
 *
 *   <SortableList v-model="rules" :item-key="(r) => r.id" :item-label="(r) => r.name" label="Rules">
 *     <template #item="{ item }">…the row…</template>
 *   </SortableList>
 *
 * Mouse and pen: drag the grip. It is the Context Injector's drag, shared
 * through `useRowDrag` (row-drag.ts + row-drag.css): the browser's ghost
 * follows the pointer (right on a zoomed canvas too), the row dims, the row
 * it lands beside opens a gap with a line, and after the drop the rows slide
 * into place and the moved row pulses. Escape cancels.
 *
 * Grouped lists decide drops themselves: `drop-line` says whether a target
 * is a drop and how its line looks (an inset line inside a group), and
 * `@drop` gets the row and edge (`before` / `after` / `end`, below the last
 * row; `end-zone` leaves room there while dragging). Without them a drop
 * that changes nothing shows no line.
 *
 * Keyboard (on the grip): Space or Enter picks the row up, the arrows move
 * it, Space or Enter drops it, Escape puts it back; Alt+↑ / Alt+↓ move it
 * one step without picking it up. Each step is said in a polite live line
 * ("Hair moved to 2 of 5"). Only the grip starts a drag, so text and
 * controls in the row work as usual.
 */
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, useId } from "vue";
import { moveItem, targetIndex, type DropEdge } from "./sortable";
import { useRowDrag, type RowDropLine } from "./row-drag";

/** A drop target as SortableList reports it: the row it lands beside. */
export interface SortableDrop { from: number; over: number; edge: DropEdge; to: number }

const props = withDefaults(defineProps<{
  modelValue: T[];
  /** A stable key per item. */
  itemKey: (item: T) => string | number;
  /** The item's name in the grip's label and the announcements. */
  itemLabel?: ((item: T, index: number) => string) | undefined;
  /** The list's name for screen readers. */
  label: string;
  disabled?: boolean | undefined;
  size?: "sm" | "md" | undefined;
  /** Whether a target is a drop and how its line looks (`inset` px, `color`).
   *  `false` hides it; `undefined` hides only a drop that changes nothing. */
  dropLine?: ((t: Omit<SortableDrop, "to">, noOp: boolean) => RowDropLine | boolean | undefined) | undefined;
  /** Leave room below the last row while dragging, for an `end` drop. */
  endZone?: boolean | undefined;
}>(), { size: "md" });

const emit = defineEmits<{
  (e: "update:modelValue", v: T[]): void;
  (e: "move", m: { from: number; to: number }): void;
  (e: "drop", d: SortableDrop): void;
}>();

const uid = useId();
const helpId = `wp-sortable-help-${uid}`;
const listEl = ref<HTMLElement | null>(null);
const said = ref("");

/** Keyboard pick-up: the row held and the order before it was picked up. */
const held = shallowRef<{ key: string | number; before: T[] } | null>(null);

const nameOf = (item: T, i: number): string => props.itemLabel?.(item, i) ?? `Item ${i + 1}`;
const total = computed(() => props.modelValue.length);
const keyStr = (item: T): string => String(props.itemKey(item));
const indexOf = (key: string): number => props.modelValue.findIndex((it) => keyStr(it) === key);

function announce(text: string): void {
  said.value = "";
  void nextTick(() => { said.value = text; });
}

function rows(): HTMLElement[] {
  return listEl.value ? [...listEl.value.querySelectorAll<HTMLElement>(":scope > .wp-sortable__row")] : [];
}

function focusGrip(key: string | number): void {
  void nextTick(() => {
    const i = props.modelValue.findIndex((it) => props.itemKey(it) === key);
    rows()[i]?.querySelector<HTMLElement>(".wp-sortable__grip")?.focus();
  });
}

function commit(from: number, to: number): void {
  if (from === to) return;
  emit("update:modelValue", moveItem(props.modelValue, from, to));
  emit("move", { from, to });
}

// ── Pointer (the browser's drag) ────────────────────────────────────────
const drag = useRowDrag({
  list: listEl,
  rowSelector: ":scope > .wp-sortable__row",
  dataType: "text/x-wp-sortable",
  accept: (from, t, noOp) => props.dropLine?.({ from: indexOf(from), over: t.index, edge: t.edge }, noOp),
  onDrop: (fromKey, t) => {
    const from = indexOf(fromKey);
    if (from < 0) return;
    const to = targetIndex(from, { over: t.index, edge: t.edge });
    const item = props.modelValue[from];
    emit("drop", { from, over: t.index, edge: t.edge, to });
    if (to !== from) {
      commit(from, to);
      announce(`${nameOf(item, from)} moved to ${to + 1} of ${total.value}`);
    }
  },
});

/** The row whose grip is pressed: only it may start a drag, so text and
 *  controls in a row select and click as usual. */
const armed = ref<string | null>(null);
function disarm(): void {
  armed.value = null;
  window.removeEventListener("pointerup", disarm, true);
}
function arm(ev: PointerEvent, item: T): void {
  if (props.disabled || ev.button !== 0 || held.value) return;
  armed.value = keyStr(item);
  window.addEventListener("pointerup", disarm, true);
}
onBeforeUnmount(disarm);

function onDragStart(ev: DragEvent, item: T): void {
  const key = keyStr(item);
  if (armed.value !== key) {
    ev.preventDefault();
    return;
  }
  ev.stopPropagation();
  drag.start(ev, key);
}

function onDragEnd(): void {
  drag.end();
  disarm();
}

// ── Keyboard ────────────────────────────────────────────────────────────
function onGripKey(ev: KeyboardEvent, i: number): void {
  if (props.disabled) return;
  const item = props.modelValue[i];
  const key = props.itemKey(item);
  const up = ev.key === "ArrowUp" || ev.key === "ArrowLeft";
  const down = ev.key === "ArrowDown" || ev.key === "ArrowRight";

  if (!held.value) {
    if (ev.key === " " || ev.key === "Enter") {
      ev.preventDefault();
      held.value = { key, before: [...props.modelValue] };
      announce(`Picked up ${nameOf(item, i)}, ${i + 1} of ${total.value}. Arrows move it, Space drops it, Escape puts it back.`);
    } else if (ev.altKey && (up || down)) {
      ev.preventDefault();
      const to = up ? i - 1 : i + 1;
      if (to < 0 || to >= total.value) return;
      commit(i, to);
      announce(`${nameOf(item, i)} moved to ${to + 1} of ${total.value}`);
      focusGrip(key);
    }
    return;
  }

  if (up || down || ev.key === "Home" || ev.key === "End") {
    ev.preventDefault();
    const to = ev.key === "Home" ? 0 : ev.key === "End" ? total.value - 1 : up ? i - 1 : i + 1;
    if (to < 0 || to >= total.value || to === i) return;
    commit(i, to);
    announce(`${nameOf(item, i)} moved to ${to + 1} of ${total.value}`);
    focusGrip(key);
  } else if (ev.key === " " || ev.key === "Enter") {
    ev.preventDefault();
    held.value = null;
    announce(`${nameOf(item, i)} dropped at ${i + 1} of ${total.value}`);
  } else if (ev.key === "Escape") {
    ev.preventDefault();
    ev.stopPropagation();
    const before = held.value.before;
    held.value = null;
    if (before.some((it, j) => it !== props.modelValue[j])) emit("update:modelValue", before);
    const back = before.findIndex((it) => props.itemKey(it) === key);
    announce(`Move cancelled. ${nameOf(item, i)} is back at ${back + 1} of ${total.value}`);
    focusGrip(key);
  }
}

function onGripBlur(i: number): void {
  // Moving the row re-inserts its element, which can blur the grip for a
  // moment; only a real focus loss drops it.
  void nextTick(() => {
    if (!held.value) return;
    const grip = rows()[props.modelValue.findIndex((it) => props.itemKey(it) === held.value?.key)]?.querySelector(".wp-sortable__grip");
    if (grip && document.activeElement !== grip) {
      const item = props.modelValue[i];
      held.value = null;
      if (item) announce(`${nameOf(item, i)} dropped`);
    }
  });
}
</script>

<template>
  <div class="wp-sortable" :data-size="size" :data-dragging="drag.dragging.value !== null ? 'true' : undefined" :data-end-zone="endZone || undefined">
    <ul ref="listEl" class="wp-sortable__list" :aria-label="label" @dragover="drag.over" @drop="drag.drop">
      <!-- The row is the drag source (the browser's ghost shows the whole row);
           only its grip arms it, and the grip has the keyboard moves. -->
      <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
      <li
        v-for="(item, i) in modelValue"
        :key="itemKey(item)"
        class="wp-sortable__row"
        :class="drag.classes(keyStr(item))"
        :style="drag.lineStyle(keyStr(item))"
        :data-drag-key="keyStr(item)"
        :data-held="held?.key === itemKey(item) || undefined"
        :draggable="armed === keyStr(item) ? 'true' : undefined"
        @dragstart="onDragStart($event, item)"
        @dragend="onDragEnd"
      >
        <span
          role="button"
          class="wp-sortable__grip"
          tabindex="0"
          :aria-label="`Move ${nameOf(item, i)}`"
          :aria-describedby="helpId"
          :aria-pressed="held?.key === itemKey(item)"
          :aria-disabled="disabled || undefined"
          @pointerdown="arm($event, item)"
          @keydown="onGripKey($event, i)"
          @blur="onGripBlur(i)"
        ><i class="pi pi-bars" aria-hidden="true" /></span>
        <div class="wp-sortable__body"><slot name="item" :item="item" :index="i" /></div>
      </li>
    </ul>
    <span :id="helpId" class="wp-sortable__sr">Space or Enter picks it up, the arrows move it, Space drops it, Escape puts it back. Alt and an arrow moves it one step.</span>
    <span class="wp-sortable__sr" aria-live="polite">{{ said }}</span>
  </div>
</template>

<style scoped src="./row-drag.css"></style>
<style scoped>
.wp-sortable { position: relative; min-width: 0; }
.wp-sortable__list { position: relative; display: flex; flex-direction: column; gap: var(--wp-space-2); margin: 0; padding: 0; list-style: none; }
.wp-sortable[data-size="sm"] .wp-sortable__list { gap: 2px; }
.wp-sortable__row {
  display: flex; align-items: center; gap: var(--wp-space-2); min-width: 0;
  border-radius: var(--wp-radius); background: var(--wp-bg-1);
}
.wp-sortable__row[data-held] { outline: 1.5px dashed var(--wp-accent); outline-offset: 1px; }
.wp-sortable__grip {
  display: inline-grid; place-items: center; flex: none; align-self: stretch;
  width: 24px; min-height: 24px; margin: 0; padding: 0; border: 0; border-radius: var(--wp-radius-sm);
  background: transparent; color: var(--wp-text-dim); cursor: grab; user-select: none;
}
.wp-sortable[data-size="sm"] .wp-sortable__grip { width: 20px; min-height: 20px; }
.wp-sortable__grip .pi { font-size: 12px; }
.wp-sortable[data-size="sm"] .wp-sortable__grip .pi { font-size: 10px; }
.wp-sortable__grip:hover:not([aria-disabled="true"]) { color: var(--wp-text); background: var(--wp-row-hover); }
.wp-sortable__grip:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--wp-border-focus); }
.wp-sortable__grip[aria-pressed="true"] { color: var(--wp-accent-text); }
.wp-sortable__grip[aria-disabled="true"] { cursor: not-allowed; opacity: 0.45; }
.wp-sortable[data-dragging] .wp-sortable__grip { cursor: grabbing; }
.wp-sortable__body { flex: 1; min-width: 0; }
/* Room below the last row while dragging, for a drop below it. */
.wp-sortable[data-end-zone] .wp-sortable__list { transition: padding-bottom var(--wp-motion-fade, 180ms) ease; }
.wp-sortable[data-end-zone][data-dragging] .wp-sortable__list { padding-bottom: 18px; }
.wp-sortable__sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
</style>
