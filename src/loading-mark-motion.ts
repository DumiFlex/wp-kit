/**
 * LoadingMark's motion, drawn on a canvas.
 *
 * The mark used to move its SVG paths with CSS. A keyframed `transform` /
 * `opacity` goes to the compositor, which blurs the path and snaps it to whole
 * pixels as it starts; animating registered custom properties fixed that in
 * Chromium, but Firefox still lays each frame of an SVG transform on the pixel
 * grid, so the rings stepped and twitched as they slid. A canvas puts every
 * shape at its exact fractional position each frame, sharp and smooth in both.
 *
 * One `requestAnimationFrame` loop draws every mark on the page. Each mark
 * keeps its own clock, so a host can slow or pause the marks inside it with
 * `data-wp-motion-speed` (a number) and `data-wp-motion-paused` on an
 * ancestor, as the kit site's Animations section does.
 */
import { RING_A, RING_B, STAR_A, STAR_B, STAR_BIG } from "./logo-paths";

/** One loop of the logo, in ms; the sparkle's swap takes two. */
export const LOOP_MS = 2400;
/** Room around the 1024 box for the rings as they slide apart (70 units)
 *  and for anti-aliasing at the edge. */
export const PAD = 82;
export const BOX = 1024 + 2 * PAD;

/** CSS `cubic-bezier(x1, y1, x2, y2)` as a function of progress. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let k = 0; k < 30; k++) {
      t = (lo + hi) / 2;
      const cx = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3;
      if (cx < x) lo = t;
      else hi = t;
    }
    return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
  };
}

const SMOOTH = cubicBezier(0.65, 0, 0.35, 1);
const EASE_IN_OUT = cubicBezier(0.42, 0, 0.58, 1);

type Stop = readonly [at: number, values: readonly number[]];

/** Value of a keyframe track at progress `p` (0..1), eased per segment the
 *  way CSS eases between two keyframes. */
export function track(stops: readonly Stop[], p: number, ease: (x: number) => number): number[] {
  for (let k = 0; k < stops.length - 1; k++) {
    const a = stops[k];
    const b = stops[k + 1];
    if (!a || !b) break;
    if (p >= a[0] && p <= b[0]) {
      if (b[0] === a[0]) return [...b[1]];
      const e = ease((p - a[0]) / (b[0] - a[0]));
      return a[1].map((v, j) => v + ((b[1][j] ?? v) - v) * e);
    }
  }
  return [...(stops[stops.length - 1]?.[1] ?? [])];
}

/** The rings' slide apart (units of the 1024 box). */
const SPLIT: readonly Stop[] = [[0, [0]], [0.15, [0]], [0.4, [70]], [0.6, [70]], [0.85, [0]], [1, [0]]];
/** The big star's dip: [scale, turn in degrees]. */
const DIP: readonly Stop[] = [[0, [1, 0]], [0.15, [1, 0]], [0.32, [0.7, 45]], [0.5, [1, 90]], [1, [1, 90]]];
/** The small stars' twinkle: [opacity, scale]. */
const TWINKLE: readonly Stop[] = [[0, [1, 1]], [0.5, [0.35, 0.6]], [1, [1, 1]]];
/** The sparkle's small stars trading places (degrees, over two loops). */
const SWAP: readonly Stop[] = [[0, [0]], [0.15, [0]], [0.5, [180]], [0.65, [180]], [1, [360]]];

export interface Pose {
  split: number;
  bigScale: number;
  bigTurn: number;
  twinkleAlpha: number;
  twinkleScale: number;
  swap: number;
}

/** Where every part is `ms` into the animation. */
export function poseAt(ms: number): Pose {
  const p = (((ms % LOOP_MS) + LOOP_MS) % LOOP_MS) / LOOP_MS;
  const p2 = (((ms % (2 * LOOP_MS)) + 2 * LOOP_MS) % (2 * LOOP_MS)) / (2 * LOOP_MS);
  const [split = 0] = track(SPLIT, p, SMOOTH);
  const [bigScale = 1, bigTurn = 0] = track(DIP, p, SMOOTH);
  const [twinkleAlpha = 1, twinkleScale = 1] = track(TWINKLE, p, EASE_IN_OUT);
  const [swap = 0] = track(SWAP, p2, SMOOTH);
  return { split, bigScale, bigTurn, twinkleAlpha, twinkleScale, swap };
}

/** Centres of the stars in the 1024 box (from their bounding boxes). */
const C_BIG = [512, 512] as const;
const C_A = [360, 664] as const;
const C_B = [664, 360] as const;

let paths: Record<"ra" | "rb" | "big" | "a" | "b", Path2D> | null = null;
function shapes(): Record<"ra" | "rb" | "big" | "a" | "b", Path2D> {
  paths ??= { ra: new Path2D(RING_A), rb: new Path2D(RING_B), big: new Path2D(STAR_BIG), a: new Path2D(STAR_A), b: new Path2D(STAR_B) };
  return paths;
}

export interface Look {
  variant: "logo" | "sparkle";
  /** [violet, indigo, teal], or three times the text colour for `mono`. */
  colours: readonly [string, string, string];
  /** Flat colours (mono): no ring gradients. */
  flat: boolean;
}

function around(ctx: CanvasRenderingContext2D, [x, y]: readonly [number, number], scale: number, turn: number, path: Path2D, fill: string, alpha: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((turn * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.translate(-x, -y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  ctx.fill(path);
  ctx.restore();
}

/** Draws one frame on a canvas `BOX` units square (scaled to its pixels). */
export function drawPose(ctx: CanvasRenderingContext2D, width: number, look: Look, pose: Pose): void {
  const k = width / BOX;
  const [violet, indigo, teal] = look.colours;
  const p = shapes();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, width);
  ctx.setTransform(k, 0, 0, k, PAD * k, PAD * k);
  if (look.variant === "logo") {
    const ringA = (() => {
      if (look.flat) return violet;
      const g = ctx.createLinearGradient(312.56, 897.19, 312.56, 2);
      g.addColorStop(0, violet);
      g.addColorStop(1, indigo);
      return g;
    })();
    const ringB = (() => {
      if (look.flat) return violet;
      const g = ctx.createLinearGradient(711.44, 126.81, 711.44, 1022);
      g.addColorStop(0, indigo);
      g.addColorStop(1, teal);
      return g;
    })();
    ctx.save();
    ctx.translate(-pose.split, -pose.split);
    ctx.fillStyle = ringA;
    ctx.fill(p.ra);
    ctx.restore();
    ctx.save();
    ctx.translate(pose.split, pose.split);
    ctx.fillStyle = ringB;
    ctx.fill(p.rb);
    ctx.restore();
    around(ctx, C_BIG, pose.bigScale, pose.bigTurn, p.big, violet, 1);
    around(ctx, C_A, pose.twinkleScale, 0, p.a, indigo, pose.twinkleAlpha);
    around(ctx, C_B, pose.twinkleScale, 0, p.b, teal, pose.twinkleAlpha);
    return;
  }
  ctx.translate(512, 512);
  ctx.scale(1.45, 1.45);
  ctx.translate(-512, -512);
  around(ctx, C_BIG, pose.bigScale, pose.bigTurn, p.big, violet, 1);
  ctx.save();
  ctx.translate(512, 512);
  ctx.rotate((pose.swap * Math.PI) / 180);
  ctx.translate(-512, -512);
  ctx.fillStyle = indigo;
  ctx.fill(p.a);
  ctx.fillStyle = teal;
  ctx.fill(p.b);
  ctx.restore();
}

/** A mark the loop draws. */
export interface Animated {
  canvas: HTMLCanvasElement;
  look: () => Look;
  /** ms of animation shown so far, advanced by the loop. */
  clock: number;
  /** False while off screen: the clock still runs, nothing is drawn. */
  visible: boolean;
}

const marks = new Set<Animated>();
let frame = 0;
let last = 0;

/** Speed and pause from the nearest host that sets them. */
export function motionOf(el: Element): { speed: number; paused: boolean } {
  const host = el.closest("[data-wp-motion-speed], [data-wp-motion-paused]");
  if (!host) return { speed: 1, paused: false };
  const paused = host.closest("[data-wp-motion-paused]") !== null;
  const speedHost = host.closest("[data-wp-motion-speed]");
  const speed = Number(speedHost?.getAttribute("data-wp-motion-speed") ?? "1");
  return { speed: Number.isFinite(speed) && speed >= 0 ? speed : 1, paused };
}

function fit(c: HTMLCanvasElement): void {
  const css = c.clientWidth;
  const want = Math.max(1, Math.round(css * (window.devicePixelRatio || 1)));
  if (c.width !== want) {
    c.width = want;
    c.height = want;
  }
}

function tick(now: number): void {
  const dt = last ? Math.min(now - last, 100) : 0;
  last = now;
  for (const m of marks) {
    const { speed, paused } = motionOf(m.canvas);
    if (!paused) m.clock += dt * speed;
    if (!m.visible) continue;
    const ctx = m.canvas.getContext("2d");
    if (!ctx) continue;
    fit(m.canvas);
    drawPose(ctx, m.canvas.width, m.look(), poseAt(m.clock));
  }
  frame = marks.size ? requestAnimationFrame(tick) : 0;
}

/** Starts drawing a mark; returns the function that stops it. */
export function animate(mark: Animated): () => void {
  marks.add(mark);
  if (!frame) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
  return () => {
    marks.delete(mark);
    if (!marks.size && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}

/** Draws one still frame right away (the first frame, before the loop runs,
 *  so the mark never shows blank). */
export function drawNow(mark: Animated): boolean {
  const ctx = mark.canvas.getContext("2d");
  if (!ctx) return false;
  fit(mark.canvas);
  drawPose(ctx, mark.canvas.width, mark.look(), poseAt(mark.clock));
  return true;
}
