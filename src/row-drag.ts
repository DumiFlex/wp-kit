/**
 * Drag-to-reorder for rows, the way the Context Injector does it: the
 * browser's own drag (its ghost follows the pointer, so it stays right on a
 * zoomed ComfyUI canvas), the dragged row dims, the row it lands next to
 * opens a gap with a glowing line in it, and after the drop the rows slide
 * into place and the moved row pulses. SortableList is built on it; a row UI
 * with its own markup (the Injector, the Context node) uses it directly with
 * `row-drag.css`.
 *
 *   const drag = useRowDrag({ list, onDrop: (from, t) => … });
 *   <div ref="list" @dragover="drag.over" @drop="drag.drop">
 *     <div v-for="r in rows" :data-drag-key="r.id" :draggable="…"
 *          :class="drag.classes(r.id)" :style="drag.lineStyle(r.id)"
 *          @dragstart="drag.start($event, r.id)" @dragend="drag.end" />
 *
 * The target is found over the whole list, not per row, so it holds still
 * while the gap opens (per-row dragover flickers between two rows).
 */
import { ref, type Ref } from "vue";
import { MOTION_CURVE_FLIP, MOTION_FLIP_MS, MOTION_PULSE_MS, shouldAnimate } from "./flip";
import { dropTarget, targetIndex, type DropEdge } from "./sortable";

/** Where a drop lands: next to the row `key` (`index` among the candidate
 *  rows), on its `edge`; `end` is below the last row. */
export interface RowDropTarget { key: string; index: number; edge: DropEdge }

/** How the line looks at a target: inset from the left (px) and its colour. */
export interface RowDropLine { inset?: number | undefined; color?: string | undefined }

export interface RowDragOptions {
  /** The element holding the rows (and taking dragover / drop). */
  list: Ref<HTMLElement | null>;
  /** Rows inside `list`, default `[data-drag-key]`. */
  rowSelector?: string | undefined;
  /** A row's key, default its `data-drag-key`. */
  keyOf?: ((el: HTMLElement) => string | null) | undefined;
  /** Which rows the dragged one may land beside (e.g. only its own kind).
   *  Default: every row. */
  candidate?: ((el: HTMLElement, from: string) => boolean) | undefined;
  /** Whether a target is a drop, and how its line looks. `false` hides it;
   *  `undefined` keeps the default, which hides a drop that changes nothing. */
  accept?: ((from: string, t: RowDropTarget, noOp: boolean) => RowDropLine | boolean | undefined) | undefined;
  /** The drop. Change the order here; the rows slide once the DOM moves. */
  onDrop: (from: string, t: RowDropTarget) => void;
  /** The drag's data type, so other drop zones can tell it apart. */
  dataType?: string | undefined;
  /** Your own hit test, for lists whose targets aren't one flat run of
   *  rows (rows inside frames, drop bars): return the target under the
   *  pointer, or null. It replaces the default; `accept` still runs. */
  locate?: ((ev: DragEvent, from: string) => RowDropTarget | null) | undefined;
  /** A drag that started somewhere else (another node's list): return its
   *  key to take it here, or null to leave it. dataTransfer's data can't be
   *  read during dragover, so tell it by its types or your own store. */
  foreign?: ((ev: DragEvent) => string | null) | undefined;
}

export interface RowDrag {
  /** The key being dragged, or null. */
  dragging: Ref<string | null>;
  /** Where it would land now. */
  target: Ref<(RowDropTarget & { line: RowDropLine }) | null>;
  /** The key that just landed (pulses for a moment). */
  pulsing: Ref<string | null>;
  start: (ev: DragEvent, key: string) => void;
  over: (ev: DragEvent) => void;
  drop: (ev: DragEvent) => void;
  end: () => void;
  /** `wp-rowdrag--dragging / --before / --after / --end / --pulse` for a row. */
  classes: (key: string) => Record<string, boolean>;
  /** The line's inset and colour as CSS variables, on its target row. */
  lineStyle: (key: string) => Record<string, string> | undefined;
}

const DEFAULT_TYPE = "text/x-wp-row";

export function useRowDrag(opts: RowDragOptions): RowDrag {
  const selector = opts.rowSelector ?? "[data-drag-key]";
  const keyOf = opts.keyOf ?? ((el: HTMLElement) => el.dataset.dragKey ?? null);
  const dragging = ref<string | null>(null);
  const target = ref<(RowDropTarget & { line: RowDropLine }) | null>(null);
  const pulsing = ref<string | null>(null);
  let pulseTimer: ReturnType<typeof setTimeout> | undefined;

  function rows(): HTMLElement[] {
    const list = opts.list.value;
    return list ? [...list.querySelectorAll<HTMLElement>(selector)] : [];
  }

  function start(ev: DragEvent, key: string): void {
    dragging.value = key;
    target.value = null;
    if (ev.dataTransfer) {
      ev.dataTransfer.effectAllowed = "move";
      // Some browsers start no drag without data; the key is read back from state.
      ev.dataTransfer.setData(opts.dataType ?? DEFAULT_TYPE, key);
    }
  }

  function end(): void {
    dragging.value = null;
    target.value = null;
  }

  /** The key being dragged over this list: ours, or a foreign one it takes. */
  function source(ev: DragEvent): string | null {
    return dragging.value ?? opts.foreign?.(ev) ?? null;
  }

  function over(ev: DragEvent): void {
    const from = source(ev);
    if (from === null) return; // not ours: leave it to whoever takes it
    ev.preventDefault();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = "move";
    const els = rows().filter((el) => !opts.candidate || opts.candidate(el, from));
    let at: RowDropTarget | null;
    if (opts.locate) at = opts.locate(ev, from);
    else {
      const t = dropTarget(ev.clientY, els.map((el) => el.getBoundingClientRect()));
      const el = t ? els[t.over] : undefined;
      const key = el ? keyOf(el) : null;
      at = t && key !== null ? { key, index: t.over, edge: t.edge } : null;
    }
    if (!at) { target.value = null; return; }
    const key = at.key;
    const fromIdx = els.findIndex((e) => keyOf(e) === from);
    const noOp = fromIdx >= 0 && (key === from || targetIndex(fromIdx, { over: at.index, edge: at.edge }) === fromIdx);
    const ok = opts.accept?.(from, at, noOp);
    if (ok === false || (ok === undefined && noOp)) { target.value = null; return; }
    const line = typeof ok === "object" ? ok : {};
    const cur = target.value;
    if (cur && cur.key === at.key && cur.edge === at.edge && cur.index === at.index
      && cur.line.inset === line.inset && cur.line.color === line.color) return;
    target.value = { ...at, line };
  }

  function drop(ev: DragEvent): void {
    const from = source(ev);
    if (from === null) return;
    ev.preventDefault();
    ev.stopPropagation(); // the host page must not read it as a file drop
    // Trust what the line showed: by now the gap has moved the rows.
    const t = target.value;
    const before = captureByKey();
    end();
    if (!t) return;
    slideWhenMoved(before, from);
    opts.onDrop(from, { key: t.key, index: t.index, edge: t.edge });
  }

  function captureByKey(): Map<string, DOMRect> {
    const out = new Map<string, DOMRect>();
    for (const el of rows()) {
      const k = keyOf(el);
      if (k !== null) out.set(k, el.getBoundingClientRect());
    }
    return out;
  }

  /** Once the rows move in the DOM, slide each from where it was, then
   *  pulse the one that landed. Waits for the change itself, so it works
   *  when the new order comes back a tick or two later. */
  function slideWhenMoved(before: Map<string, DOMRect>, moved: string): void {
    const list = opts.list.value;
    if (!list || typeof MutationObserver === "undefined") return;
    let done = false;
    const run = (): void => {
      if (done) return;
      done = true;
      obs.disconnect();
      clearTimeout(giveUp);
      if (!shouldAnimate()) return;
      for (const el of rows()) {
        const k = keyOf(el);
        const was = k === null ? undefined : before.get(k);
        if (!was) continue;
        const now = el.getBoundingClientRect();
        const dx = was.left - now.left;
        const dy = was.top - now.top;
        if (dx === 0 && dy === 0) continue;
        el.style.transition = "none";
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
          el.style.transition = `transform ${MOTION_FLIP_MS}ms ${MOTION_CURVE_FLIP}`;
          el.style.transform = "";
          setTimeout(() => { el.style.transition = ""; }, MOTION_FLIP_MS);
        });
      }
      clearTimeout(pulseTimer);
      pulseTimer = setTimeout(() => {
        pulsing.value = moved;
        pulseTimer = setTimeout(() => { pulsing.value = null; }, MOTION_PULSE_MS);
      }, MOTION_FLIP_MS);
    };
    const obs = new MutationObserver(run);
    obs.observe(list, { childList: true, subtree: true });
    const giveUp = setTimeout(() => { done = true; obs.disconnect(); }, 1000);
  }

  function classes(key: string): Record<string, boolean> {
    const t = target.value;
    const here = t?.key === key;
    return {
      "wp-rowdrag--dragging": dragging.value === key,
      "wp-rowdrag--before": here && t?.edge === "before",
      "wp-rowdrag--after": here && t?.edge === "after",
      "wp-rowdrag--end": here && t?.edge === "end",
      "wp-rowdrag--pulse": pulsing.value === key,
    };
  }

  function lineStyle(key: string): Record<string, string> | undefined {
    const t = target.value;
    if (!t || t.key !== key) return undefined;
    const s: Record<string, string> = {};
    if (t.line.inset !== undefined) s["--wp-rowdrag-inset"] = `${t.line.inset}px`;
    if (t.line.color !== undefined) s["--wp-rowdrag-color"] = t.line.color;
    return s;
  }

  return { dragging, target, pulsing, start, over, drop, end, classes, lineStyle };
}
