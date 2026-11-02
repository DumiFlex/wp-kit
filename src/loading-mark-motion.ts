/**
 * LoadingMark's motion, drawn on a canvas (see `canvas-motion.ts` for why).
 * The same keyframes the mark had in CSS, as eased tracks.
 */
import { RING_A, RING_B, STAR_A, STAR_B, STAR_BIG } from "./logo-paths";
import { EASE_IN_OUT, SMOOTH, begin, fillAround, track, type Stop } from "./canvas-motion";

/** One loop of the logo, in ms; the sparkle's swap takes two. */
export const LOOP_MS = 2400;
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
export const C_BIG = [512, 512] as const;
export const C_A = [360, 664] as const;
export const C_B = [664, 360] as const;

let paths: Record<"ra" | "rb" | "big" | "a" | "b", Path2D> | null = null;
export function shapes(): Record<"ra" | "rb" | "big" | "a" | "b", Path2D> {
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

/** Draws one frame on a canvas `BOX` units square (scaled to its pixels). */
export function drawPose(ctx: CanvasRenderingContext2D, width: number, look: Look, pose: Pose): void {
  const [violet, indigo, teal] = look.colours;
  const p = shapes();
  begin(ctx, width);
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
    fillAround(ctx, C_BIG, pose.bigScale, pose.bigTurn, p.big, violet, 1);
    fillAround(ctx, C_A, pose.twinkleScale, 0, p.a, indigo, pose.twinkleAlpha);
    fillAround(ctx, C_B, pose.twinkleScale, 0, p.b, teal, pose.twinkleAlpha);
    return;
  }
  ctx.translate(512, 512);
  ctx.scale(1.45, 1.45);
  ctx.translate(-512, -512);
  fillAround(ctx, C_BIG, pose.bigScale, pose.bigTurn, p.big, violet, 1);
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
