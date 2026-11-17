/**
 * Helpers for TrianglePad: three shares that add up to a total (a mix of
 * three things), shown as a point inside a triangle whose corners are the
 * three things. All maths in a 0..100 box, y down: corner 0 on top, 1 bottom
 * left, 2 bottom right.
 */

export type Shares = [number, number, number];
type Pt = [number, number];

/** The triangle's corners: equilateral, 88 wide, room above and below for words. */
export const CORNERS: readonly [Pt, Pt, Pt] = [[50, 12], [6, 88.21], [94, 88.21]];
/** The triangle's height in the box. */
export const TRI_HEIGHT = CORNERS[1][1] - CORNERS[0][1];

/** The shares (0..1, adding up to 1) of a point, a point outside folded onto the nearest edge. */
export function sharesAt(x: number, y: number): Shares {
  const [[ax, ay], [bx, by], [cx, cy]] = CORNERS;
  const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
  const a = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / d;
  const b = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / d;
  return clampShares([a, b, 1 - a - b]);
}

/** Shares with no negative part, adding up to 1 (all equal when nothing is left). */
export function clampShares(s: readonly number[]): Shares {
  const pos = [0, 1, 2].map((i) => {
    const v = s[i] ?? 0;
    return Number.isFinite(v) && v > 0 ? v : 0;
  });
  const sum = pos.reduce((p, v) => p + v, 0);
  if (sum <= 0) return [1 / 3, 1 / 3, 1 / 3];
  return [(pos[0] ?? 0) / sum, (pos[1] ?? 0) / sum, (pos[2] ?? 0) / sum];
}

/** Where shares (any scale) sit in the box. */
export function pointOf(s: readonly number[]): Pt {
  const w = clampShares(s);
  let x = 0;
  let y = 0;
  CORNERS.forEach(([cx, cy], i) => {
    x += (w[i] ?? 0) * cx;
    y += (w[i] ?? 0) * cy;
  });
  return [x, y];
}

/**
 * Shares (any scale) as whole steps of `total` that still add up to it:
 * each is rounded down, then the steps left over go to the largest remainders
 * (ties to the first corner).
 */
export function roundShares(s: readonly number[], total: number, step: number): Shares {
  const w = clampShares(s);
  const units = step > 0 ? Math.max(1, Math.round(total / step)) : 0;
  if (!units) return [w[0] * total, w[1] * total, w[2] * total];
  const raw = w.map((v) => v * units);
  const out = raw.map((v) => Math.floor(v + 1e-9));
  let left = units - out.reduce((p, v) => p + v, 0);
  const order = [0, 1, 2].sort((i, j) => ((raw[j] ?? 0) - (out[j] ?? 0)) - ((raw[i] ?? 0) - (out[i] ?? 0)) || i - j);
  for (const i of order) {
    if (left <= 0) break;
    out[i] = (out[i] ?? 0) + 1;
    left--;
  }
  const at = (i: number): number => Number(((out[i] ?? 0) * (total / units)).toFixed(6));
  return [at(0), at(1), at(2)];
}

/** Lines across the triangle where one corner's share is `t` (0..1): from its edge with the next corner to its edge with the other. */
export function shareLine(corner: 0 | 1 | 2, t: number): [number, number, number, number] {
  const c = CORNERS[corner];
  const j = CORNERS[(corner + 1) % 3] ?? c;
  const k = CORNERS[(corner + 2) % 3] ?? c;
  const lerp = (p: Pt, q: Pt): Pt => [t * p[0] + (1 - t) * q[0], t * p[1] + (1 - t) * q[1]];
  const [x1, y1] = lerp(c, j);
  const [x2, y2] = lerp(c, k);
  return [x1, y1, x2, y2];
}
