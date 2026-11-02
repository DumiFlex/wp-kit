/**
 * WorkingLine's marks, drawn on a canvas (see `canvas-motion.ts` for why).
 * The same keyframes, delays and easings the marks had in CSS; `period` is
 * the tempo's loop (2.8 s slow, 2.2 s mid, 1.5 s fast).
 */
import {
  EASE_IN_OUT,
  SMOOTH,
  begin,
  cubicBezier,
  fillAround,
  loop,
  mix,
  track,
  type Stop,
} from "./canvas-motion";
import { C_A, C_B, C_BIG, shapes } from "./loading-mark-motion";

export type WorkingVariant = "typing" | "shuffle" | "orbit" | "burst";

/** Loop length per tempo, in ms. */
export const TEMPO_MS = { slow: 2800, mid: 2200, fast: 1500 } as const;

const SPIN_EASE = cubicBezier(0.5, 0.1, 0.5, 0.9);
const BURST_EASE = cubicBezier(0.3, 0, 0.2, 1);

/** A typing star's hop: [lift (units), scale]. */
const HOP: readonly Stop[] = [[0, [0, 1]], [0.2, [-110, 1.12]], [0.4, [0, 1]], [1, [0, 1]]];
const SWAP: readonly Stop[] = [[0, [0]], [0.15, [0]], [0.5, [180]], [0.65, [180]], [1, [360]]];
/** The big star's dip: [scale, turn]. */
const DIP: readonly Stop[] = [[0, [1, 0]], [0.15, [1, 0]], [0.32, [0.7, 45]], [0.5, [1, 90]], [1, [1, 90]]];
/** An orbit node's twinkle: [opacity, scale]. */
const TWINKLE: readonly Stop[] = [[0, [1, 1]], [0.5, [0.35, 0.6]], [1, [1, 1]]];
const BREATHE: readonly Stop[] = [[0, [1]], [0.5, [0.86]], [1, [1]]];
/** The big star's pop under a burst. */
const POP: readonly Stop[] = [[0, [1.1]], [0.4, [0.8]], [1, [1.1]]];
/** Burst, per property as CSS reads it: how far out (1 = flown out), scale, opacity. */
const BURST_F: readonly Stop[] = [[0, [1]], [0.45, [0]], [0.75, [0]], [1, [1]]];
const BURST_S: readonly Stop[] = [[0, [0]], [0.45, [1.15]], [0.75, [1.15]], [1, [0]]];
const BURST_O: readonly Stop[] = [[0, [0]], [0.15, [1]], [0.75, [1]], [1, [0]]];

/** [big star, star A, star B] colours. */
export type Colours = readonly [string, string, string];

/** The orbit's four nodes: position and colour (steps between the brand's). */
export function orbitNodes([big, a, b]: Colours): [number, number, string][] {
  return [[911, 512, b], [512, 911, mix(b, a, 0.7)], [113, 512, mix(big, a, 0.6)], [512, 113, a]];
}

/** Typing stars: the big sparkle drawn small three times in a row. */
export const TYPING_X = [250, 512, 774] as const;

let dot: Path2D | null = null;

/** Draws one frame of a WorkingLine mark. */
export function drawWorking(ctx: CanvasRenderingContext2D, width: number, ms: number, variant: WorkingVariant, period: number, colours: Colours): void {
  const [big, a, b] = colours;
  const p = shapes();
  begin(ctx, width);
  if (variant === "typing") {
    const fills = [a, big, b];
    TYPING_X.forEach((x, k) => {
      const [lift = 0, s = 1] = track(HOP, loop(ms, period, period * k * 0.15), EASE_IN_OUT);
      ctx.save();
      // The big star at half size, its centre moved to (x, 512).
      ctx.translate(x - 512, lift);
      fillAround(ctx, C_BIG, 0.5 * s, 0, p.big, fills[k] ?? big);
      ctx.restore();
    });
    return;
  }
  if (variant === "shuffle") {
    ctx.translate(512, 512);
    ctx.scale(1.45, 1.45);
    ctx.translate(-512, -512);
    const [ds = 1, dr = 0] = track(DIP, loop(ms, period), SMOOTH);
    fillAround(ctx, C_BIG, ds, dr, p.big, big);
    const [sr = 0] = track(SWAP, loop(ms, period * 2), SMOOTH);
    ctx.save();
    ctx.translate(512, 512);
    ctx.rotate((sr * Math.PI) / 180);
    ctx.translate(-512, -512);
    ctx.fillStyle = a;
    ctx.fill(p.a);
    ctx.fillStyle = b;
    ctx.fill(p.b);
    ctx.restore();
    return;
  }
  if (variant === "orbit") {
    dot ??= circle();
    const [spin = 0] = track([[0, [0]], [1, [360]]], loop(ms, period * 2), SPIN_EASE);
    ctx.save();
    ctx.translate(512, 512);
    ctx.rotate((spin * Math.PI) / 180);
    ctx.translate(-512, -512);
    orbitNodes(colours).forEach(([x, y, c], k) => {
      const [o = 1, s = 1] = track(TWINKLE, loop(ms + period * k * 0.25, period), EASE_IN_OUT);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.globalAlpha = o;
      ctx.fillStyle = c;
      ctx.fill(dot ?? circle());
      ctx.restore();
    });
    ctx.restore();
    const [bs = 1] = track(BREATHE, loop(ms, period), EASE_IN_OUT);
    fillAround(ctx, C_BIG, bs, 0, p.big, big);
    fillAround(ctx, C_A, 1, 0, p.a, a);
    fillAround(ctx, C_B, 1, 0, p.b, b);
    return;
  }
  ctx.translate(512, 512);
  ctx.scale(1.3, 1.3);
  ctx.translate(-512, -512);
  const pp = loop(ms, period);
  const [ps = 1] = track(POP, pp, EASE_IN_OUT);
  fillAround(ctx, C_BIG, ps, 0, p.big, big);
  const [f = 0] = track(BURST_F, pp, BURST_EASE);
  const [s = 0] = track(BURST_S, pp, BURST_EASE);
  const [o = 0] = track(BURST_O, pp, BURST_EASE);
  for (const [centre, path, fill, dx, dy] of [[C_A, p.a, a, 152, -152], [C_B, p.b, b, -152, 152]] as const) {
    ctx.save();
    ctx.translate(dx * f, dy * f);
    fillAround(ctx, centre, s, 0, path, fill, o);
    ctx.restore();
  }
}

function circle(): Path2D {
  const c = new Path2D();
  c.arc(0, 0, 70, 0, Math.PI * 2);
  return c;
}
