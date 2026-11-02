/**
 * Looping marks drawn on a canvas (LoadingMark, WorkingLine).
 *
 * A keyframed `transform` / `opacity` on an SVG path goes to the compositor,
 * which blurs the path and snaps it to whole pixels as it starts. Animating
 * registered custom properties fixed that in Chromium, but Firefox still lays
 * each frame of an SVG transform on the pixel grid, so small marks stepped
 * and twitched as they moved. A canvas puts every shape at its exact
 * fractional position each frame, sharp and smooth in both.
 *
 * One `requestAnimationFrame` loop draws every mark on the page. Each mark
 * keeps its own clock, so a host can slow or pause the marks inside it with
 * `data-wp-motion-speed` (a number) and `data-wp-motion-paused` on an
 * ancestor, as the kit site's Animations section does.
 *
 * A mark keeps its still SVG for the first paint, under reduced motion and
 * in a test DOM; `useCanvasMotion` puts the canvas over it once it can draw.
 */
import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from "vue";

/** Room around the 1024 box for parts that move past its edge, and for
 *  anti-aliasing there. */
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

export const EASE = cubicBezier(0.25, 0.1, 0.25, 1);
export const EASE_IN_OUT = cubicBezier(0.42, 0, 0.58, 1);
export const SMOOTH = cubicBezier(0.65, 0, 0.35, 1);

export type Stop = readonly [at: number, values: readonly number[]];

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

/** Progress (0..1) through a loop of `period` ms, `ms` into the animation.
 *  A positive `delay` holds the start pose until it has passed, like CSS. */
export function loop(ms: number, period: number, delay = 0): number {
  const t = ms - delay;
  if (t < 0) return 0;
  return (t % period) / period;
}

/** Mixes two `#rrggbb` colours in sRGB, like `color-mix(in srgb, a w%, b)`. */
export function mix(a: string, b: string, weightA: number): string {
  const ch = (hex: string, i: number): number => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) * weightA + ch(b, i) * (1 - weightA)));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Fills `path` scaled and turned around `[x, y]`. */
export function fillAround(
  ctx: CanvasRenderingContext2D,
  [x, y]: readonly [number, number],
  scale: number,
  turn: number,
  path: Path2D,
  fill: string | CanvasGradient,
  alpha = 1,
): void {
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

/** Clears the canvas and sets it up to draw in the 1024 box. */
export function begin(ctx: CanvasRenderingContext2D, width: number): void {
  const k = width / BOX;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, width);
  ctx.setTransform(k, 0, 0, k, PAD * k, PAD * k);
}

/** Draws one frame `ms` into the animation on a square canvas `width` px wide. */
export type Draw = (ctx: CanvasRenderingContext2D, width: number, ms: number) => void;

/** A mark the loop draws. */
export interface Animated {
  canvas: HTMLCanvasElement;
  draw: Draw;
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
  const paused = el.closest("[data-wp-motion-paused]") !== null;
  const speedHost = el.closest("[data-wp-motion-speed]");
  const speed = Number(speedHost?.getAttribute("data-wp-motion-speed") ?? "1");
  return { speed: Number.isFinite(speed) && speed >= 0 ? speed : 1, paused };
}

function fit(c: HTMLCanvasElement): void {
  const want = Math.max(1, Math.round(c.clientWidth * (window.devicePixelRatio || 1)));
  if (c.width !== want) {
    c.width = want;
    c.height = want;
  }
}

function paint(m: Animated): boolean {
  const ctx = m.canvas.getContext("2d");
  if (!ctx) return false;
  fit(m.canvas);
  m.draw(ctx, m.canvas.width, m.clock);
  return true;
}

function tick(now: number): void {
  const dt = last ? Math.min(now - last, 100) : 0;
  last = now;
  for (const m of marks) {
    const { speed, paused } = motionOf(m.canvas);
    if (!paused) m.clock += dt * speed;
    if (m.visible) paint(m);
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

/** Draws one frame right away (before the loop runs, so the mark never
 *  shows blank). False when there is no 2D canvas. */
export function drawNow(mark: Animated): boolean {
  return paint(mark);
}

/** Inline style for a canvas over a `px`-wide mark, reaching PAD past it. */
export function canvasBox(px: number): Record<string, string> {
  const side = (px * BOX) / 1024;
  const off = (px * PAD) / 1024;
  return { width: `${side}px`, height: `${side}px`, top: `${-off}px`, left: `${-off}px` };
}

/**
 * Runs a mark's canvas while motion is allowed. Render
 * `<canvas v-if="live" ref="canvas">` over the still SVG, and hide the SVG
 * while `drawn`.
 */
export function useCanvasMotion(canvas: Ref<HTMLCanvasElement | null>, draw: Draw): { live: Ref<boolean>; drawn: Ref<boolean> } {
  const live = ref(false);
  const drawn = ref(false);
  let stop: (() => void) | null = null;
  let observer: IntersectionObserver | null = null;
  let motion: MediaQueryList | null = null;

  async function start(): Promise<void> {
    if (stop) return;
    live.value = true;
    await nextTick();
    const el = canvas.value;
    if (!el || !live.value) return;
    const mark: Animated = { canvas: el, draw, clock: 0, visible: true };
    if (!drawNow(mark)) {
      live.value = false;
      return;
    }
    drawn.value = true;
    stop = animate(mark);
    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver((entries) => {
        for (const e of entries) mark.visible = e.isIntersecting;
      });
      observer.observe(el);
    }
  }
  function halt(): void {
    stop?.();
    stop = null;
    observer?.disconnect();
    observer = null;
    live.value = false;
    drawn.value = false;
  }
  function onMotionChange(): void {
    if (motion?.matches) halt();
    else void start();
  }

  onMounted(() => {
    // No matchMedia means no way to honour reduced motion, and a test DOM
    // (jsdom) has no canvas and logs an error for every attempt: keep the
    // still SVG in both.
    if (typeof window.matchMedia !== "function" || typeof requestAnimationFrame !== "function") return;
    if (navigator.userAgent.includes("jsdom")) return;
    motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    motion.addEventListener?.("change", onMotionChange);
    if (!motion.matches) void start();
  });
  onBeforeUnmount(() => {
    motion?.removeEventListener?.("change", onMotionChange);
    halt();
  });
  return { live, drawn };
}
