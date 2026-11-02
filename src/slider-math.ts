/**
 * Number helpers for Slider (one thumb or a pair): clamp
 * to the ends, snap to the step counted from `min`, and turn a pointer
 * position into a value. Steps like 0.1 snap without float fuzz.
 */
export function decimals(step: number): number {
  const s = String(step);
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
}

export function snap(v: number, min: number, max: number, step: number): number {
  if (!Number.isFinite(v)) return min;
  const clamped = Math.min(max, Math.max(min, v));
  if (step <= 0) return clamped;
  const n = Math.round((clamped - min) / step);
  const out = Math.min(max, min + n * step);
  return Number(out.toFixed(Math.max(decimals(step), decimals(min))));
}

/** Where `v` sits between `min` and `max`, 0 to 100. */
export function percentOf(v: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
}

/** The value under a pointer at `x` on a track from `left`, `width` wide. */
export function valueAt(x: number, left: number, width: number, min: number, max: number, step: number): number {
  const t = width > 0 ? (x - left) / width : 0;
  return snap(min + t * (max - min), min, max, step);
}

/** The value one key press away, or null for a key the slider ignores. */
export function keyStep(key: string, v: number, min: number, max: number, step: number, big = 10): number | null {
  const s = step > 0 ? step : (max - min) / 100;
  switch (key) {
    case "ArrowRight": case "ArrowUp": return snap(v + s, min, max, step);
    case "ArrowLeft": case "ArrowDown": return snap(v - s, min, max, step);
    case "PageUp": return snap(v + s * big, min, max, step);
    case "PageDown": return snap(v - s * big, min, max, step);
    case "Home": return min;
    case "End": return max;
    default: return null;
  }
}

/**
 * Mark snapping. `snap: true` keeps the value on a mark (the nearest one);
 * a number pulls it onto a mark only within that distance, so the thumb
 * moves freely by its step elsewhere and "clicks" into a mark near one.
 * With no marks, or snap off, the value comes back as it was.
 */
export function snapToMarks(v: number, marks: readonly number[], snapTo: boolean | number | undefined): number {
  if (!snapTo || !marks.length) return v;
  let best = marks[0] ?? v;
  for (const m of marks) if (Math.abs(m - v) < Math.abs(best - v)) best = m;
  if (snapTo === true) return best;
  return Math.abs(best - v) <= snapTo ? best : v;
}

/**
 * A key press on a slider that only takes marks (`snap: true`): arrows go to
 * the next mark up or down, PageUp/PageDown jump `big` marks, Home/End the
 * first and last. Null for a key the slider ignores.
 */
export function keyToMark(key: string, v: number, marks: readonly number[], big = 3): number | null {
  const sorted = [...new Set(marks)].sort((a, b) => a - b);
  if (!sorted.length) return null;
  // Where v sits: the index of the mark at it, or between two marks.
  const at = sorted.findIndex((m) => m >= v);
  const exact = at >= 0 && sorted[at] === v;
  const up = (n: number): number => {
    const from = at < 0 ? sorted.length : exact ? at : at - 1;
    return sorted[Math.min(sorted.length - 1, from + n)] ?? v;
  };
  const down = (n: number): number => {
    const from = at < 0 ? sorted.length : at;
    return sorted[Math.max(0, from - n)] ?? v;
  };
  switch (key) {
    case "ArrowRight": case "ArrowUp": return up(1);
    case "ArrowLeft": case "ArrowDown": return down(1);
    case "PageUp": return up(big);
    case "PageDown": return down(big);
    case "Home": return sorted[0] ?? v;
    case "End": return sorted[sorted.length - 1] ?? v;
    default: return null;
  }
}
