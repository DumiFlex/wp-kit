/**
 * Pure helpers for SortableList: move one item in a list, and work out where
 * a dragged row lands from the pointer and the rows' boxes.
 */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const out = [...list];
  if (from < 0 || from >= out.length) return out;
  const [it] = out.splice(from, 1);
  out.splice(Math.min(Math.max(0, to), out.length), 0, it);
  return out;
}

/** Which side of row `over` a drop lands on; `end` is below the last row. */
export type DropEdge = "before" | "after" | "end";
export interface DropTarget { over: number; edge: DropEdge }

/**
 * Where the pointer points: before a row while it is over the row's top half
 * (or the gap above it), after it over the bottom half, and `end` below the
 * last row. `boxes` are the rows' tops and bottoms in list order.
 */
export function dropTarget(y: number, boxes: readonly { top: number; bottom: number }[]): DropTarget | null {
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    if (!b) continue;
    if (y <= (b.top + b.bottom) / 2) return { over: i, edge: "before" };
    if (y < b.bottom) return { over: i, edge: "after" };
  }
  return boxes.length ? { over: boxes.length - 1, edge: "end" } : null;
}

/**
 * Whether `y` is in the gap a drop target opened: below its row for `after`
 * / `end`, above it for `before`. The gap is a margin, outside the row's box,
 * so `dropTarget` would read the pointer there as the next row's top or the
 * list's end; the line is drawn in it, though, so a pointer resting on the
 * line must keep that target. `gap` is the margin in screen pixels.
 */
export function inDropGap(y: number, box: { top: number; bottom: number }, edge: DropEdge, gap: number): boolean {
  if (gap <= 0) return false;
  return edge === "before" ? y >= box.top - gap && y < box.top : y >= box.bottom && y <= box.bottom + gap;
}

/** The index the dragged row `from` ends up at for a drop target. */
export function targetIndex(from: number, t: DropTarget): number {
  const at = t.edge === "before" ? t.over : t.over + 1;
  return at > from ? at - 1 : at;
}

/**
 * The index the dragged row ends up at: the number of OTHER rows whose
 * middle is above the pointer. `mids` are the rows' vertical middles in
 * list order, the dragged row's included.
 */
export function dropIndex(y: number, mids: readonly number[], from: number): number {
  let n = 0;
  mids.forEach((m, i) => { if (i !== from && m < y) n++; });
  return n;
}
