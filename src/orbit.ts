/**
 * Helpers for OrbitPad: a point around a subject, as an angle around it
 * (0 = front, 90 = right, ±180 = back), a height angle (0 = eye level,
 * 90 = straight above) and a distance. All maths in a 0..100 box, y down.
 */

/** An angle folded into (-180, 180]. */
export function wrapAngle(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  let a = deg % 360;
  if (a <= -180) a += 360;
  if (a > 180) a -= 360;
  return a === 0 ? 0 : a;
}

/** The angle around the centre of an offset (dx right, dy down): down is 0 (front), right 90. */
export function aroundOf(dx: number, dy: number): number {
  if (dx === 0 && dy === 0) return 0;
  return wrapAngle((Math.atan2(dx, dy) * 180) / Math.PI);
}

/** An angle on its step (from 0), folded. */
export function snapAngle(deg: number, step: number): number {
  const a = step > 0 ? Math.round(deg / step) * step : deg;
  return wrapAngle(Number(a.toFixed(6)));
}

/** Where angle `deg` at radius `r` sits around (50, 50), in the 0..100 box. */
export function aroundPoint(deg: number, r: number): [number, number] {
  const t = (deg * Math.PI) / 180;
  return [50 + r * Math.sin(t), 50 + r * Math.cos(t)];
}

/** The side view: the subject sits here, the arc goes round it. */
export const SIDE_CENTRE: [number, number] = [26, 62];
/** The side view's longest arc radius (distance at its max). */
export const SIDE_RADIUS = 46;

/** Where height `deg` at radius `r` sits in the side view (0 points right, 90 up). */
export function heightPoint(deg: number, r: number): [number, number] {
  const t = (deg * Math.PI) / 180;
  return [SIDE_CENTRE[0] + r * Math.cos(t), SIDE_CENTRE[1] - r * Math.sin(t)];
}

/** The height angle of a point in the side view, clamped to min..max. */
export function heightOf(x: number, y: number, min: number, max: number): number {
  const a = (Math.atan2(SIDE_CENTRE[1] - y, x - SIDE_CENTRE[0]) * 180) / Math.PI;
  // Behind the subject (left of it), fold onto the nearer end.
  const folded = a < -90 ? max : a;
  return Math.min(max, Math.max(min, folded));
}

/** An SVG arc path around the side view's subject from `from` to `to` degrees. */
export function heightArc(from: number, to: number, r: number): string {
  const [x1, y1] = heightPoint(from, r);
  const [x2, y2] = heightPoint(to, r);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 0 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** The radius (in the box) for a distance: never on the subject, never off the edge. */
export function radiusOf(dist: number, min: number, max: number, inner: number, outer: number): number {
  if (!(max > min)) return outer;
  const t = Math.min(1, Math.max(0, (dist - min) / (max - min)));
  return inner + t * (outer - inner);
}

/** The distance a radius stands for (the reverse of `radiusOf`). */
export function distOf(r: number, min: number, max: number, inner: number, outer: number): number {
  if (!(outer > inner)) return max;
  const t = Math.min(1, Math.max(0, (r - inner) / (outer - inner)));
  return min + t * (max - min);
}
