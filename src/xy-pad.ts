/**
 * Helpers for XYPad: where its dots go, what a word band covers, where a
 * ratio guide crosses the pad, and keeping a stick's point inside its circle.
 */

/** A labelled stretch of one axis, from the previous band's end up to `to`. */
export interface PadBand {
  to: number;
  label: string;
}

/** Up to how many dots per side `stepDots` puts one on every step. */
export const STEP_DOTS_MAX = 16;

/**
 * Dot positions (values) along one axis: one per step strictly inside the
 * range while that is at most `limit` dots, else one every k steps (the
 * smallest k that keeps it to `limit`, or a little more when that splits the
 * range evenly), so the dots stay evenly spaced.
 * Without a step, `limit` evenly spaced dots. Ends are left out (the pad's
 * edge is already there).
 */
export function stepDots(min: number, max: number, step: number, limit = STEP_DOTS_MAX): number[] {
  if (!(max > min) || limit <= 0) return [];
  const span = max - min;
  if (step > 0) {
    const inner = Math.round(span / step) - 1;
    if (inner <= 0) return [];
    if (inner <= limit) return Array.from({ length: inner }, (_, i) => round(min + (i + 1) * step, step));
    const steps = inner + 1;
    // The fewest steps per dot that keeps to the limit, moved up to one that
    // divides the range when there is one close by (no short last gap).
    const least = Math.ceil(steps / (limit + 1));
    let k = least;
    for (let d = least; d <= least * 2; d++) if (steps % d === 0) { k = d; break; }
    const out: number[] = [];
    for (let n = k; n < steps; n += k) out.push(round(min + n * step, step));
    return out;
  }
  const out: number[] = [];
  for (let i = 1; i <= limit; i++) {
    const raw = min + (span * i) / (limit + 1);
    const v = step > 0 ? round(min + Math.round((raw - min) / step) * step, step) : raw;
    if (v > min && v < max && out[out.length - 1] !== v) out.push(v);
  }
  return out;
}

/** Evenly spaced dot positions (values), `n` of them inside the range. */
export function evenDots(min: number, max: number, n: number): number[] {
  const count = Math.max(0, Math.floor(n));
  return Array.from({ length: count }, (_, i) => min + ((max - min) * (i + 1)) / (count + 1));
}

/** The dot (or end) nearest `v`; `v` itself when there are none. */
export function nearestStop(v: number, stops: readonly number[], min: number, max: number): number {
  let best = v;
  let gap = Infinity;
  for (const s of [min, ...stops, max]) {
    const d = Math.abs(s - v);
    if (d < gap) { gap = d; best = s; }
  }
  return best;
}

/** Each band as a stretch of the axis in percent, clipped to the range. */
export function bandSpans(bands: readonly PadBand[], min: number, max: number): { from: number; to: number; label: string }[] {
  if (!(max > min)) return [];
  const pct = (v: number): number => Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
  const out: { from: number; to: number; label: string }[] = [];
  let start = min;
  bands.forEach((b, i) => {
    const end = i === bands.length - 1 ? max : b.to;
    if (end > start) out.push({ from: pct(start), to: pct(end), label: b.label });
    start = Math.max(start, end);
  });
  return out.filter((s) => s.to > s.from);
}

/**
 * Where the line height = ratio × width (in values, through 0,0) crosses the
 * pad, in percent: [x1, y1, x2, y2], or null when it misses the pad.
 */
export function guideLine(
  ratio: number, xMin: number, xMax: number, yMin: number, yMax: number,
): [number, number, number, number] | null {
  if (!(ratio > 0) || !(xMax > xMin) || !(yMax > yMin)) return null;
  // Clip the segment x in [xMin, xMax] of y = r x to y in [yMin, yMax].
  const lo = Math.max(xMin, yMin / ratio);
  const hi = Math.min(xMax, yMax / ratio);
  if (!(hi > lo)) return null;
  const px = (v: number): number => ((v - xMin) / (xMax - xMin)) * 100;
  const py = (v: number): number => ((v - yMin) / (yMax - yMin)) * 100;
  return [px(lo), py(lo * ratio), px(hi), py(hi * ratio)];
}

/** A ratio as a short name: 1.333 → "4:3", 0.5625 → "9:16"; else "1.25:1". */
export function ratioName(r: number): string {
  for (let d = 1; d <= 21; d++) {
    const n = r * d;
    if (Math.abs(n - Math.round(n)) < 0.01 && Math.round(n) <= 32) return `${Math.round(n)}:${d}`;
  }
  return `${Number(r.toFixed(2))}:1`;
}

/** Pulls a point (in percent of the pad) back inside the pad's inscribed circle. */
export function insideCircle(xPct: number, yPct: number): [number, number] {
  const dx = xPct - 50;
  const dy = yPct - 50;
  const d = Math.hypot(dx, dy);
  if (d <= 50) return [xPct, yPct];
  return [50 + (dx / d) * 50, 50 + (dy / d) * 50];
}

function round(v: number, step: number): number {
  const s = String(step);
  const dec = s.includes("e-") ? Number(s.split("e-")[1]) : (s.split(".")[1]?.length ?? 0);
  return Number(v.toFixed(dec));
}
