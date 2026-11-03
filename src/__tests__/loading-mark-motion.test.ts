import { describe, expect, it } from "vitest";
import { cubicBezier, loop, mix, motionOf, track } from "../canvas-motion";
import { LOOP_MS, poseAt } from "../loading-mark-motion";

describe("loading-mark-motion", () => {
  it("eases like CSS cubic-bezier", () => {
    const linear = cubicBezier(0, 0, 1, 1);
    expect(linear(0.3)).toBeCloseTo(0.3, 3);
    const smooth = cubicBezier(0.65, 0, 0.35, 1);
    expect(smooth(0.5)).toBeCloseTo(0.5, 3);
    expect(smooth(0.1)).toBeLessThan(0.1);
  });

  it("reads keyframe tracks between stops", () => {
    const stops = [[0, [0]], [0.5, [10]], [1, [0]]] as const;
    expect(track(stops, 0.25, (x) => x)).toEqual([5]);
    expect(track(stops, 0.75, (x) => x)).toEqual([5]);
    expect(track(stops, 1, (x) => x)).toEqual([0]);
  });

  it("follows the old keyframes: rings shut, then apart, then shut", () => {
    expect(poseAt(0).split).toBe(0);
    expect(poseAt(LOOP_MS * 0.5).split).toBeCloseTo(70, 5);
    expect(poseAt(LOOP_MS * 0.27).split).toBeGreaterThan(0);
    expect(poseAt(LOOP_MS).split).toBe(0);
    expect(poseAt(LOOP_MS * 0.32).bigScale).toBeCloseTo(0.7, 5);
    expect(poseAt(LOOP_MS * 0.5).twinkleAlpha).toBeCloseTo(0.35, 5);
    expect(poseAt(LOOP_MS).swap).toBeCloseTo(180, 5);
  });

  it("moves a little every frame while the rings slide (no steps)", () => {
    let prev = poseAt(LOOP_MS * 0.16).split;
    for (let ms = LOOP_MS * 0.16 + 16; ms < LOOP_MS * 0.39; ms += 16) {
      const now = poseAt(ms).split;
      expect(now).toBeGreaterThan(prev);
      prev = now;
    }
  });

  it("holds a delayed loop at its start and mixes colours", () => {
    expect(loop(100, 1000, 300)).toBe(0);
    expect(loop(1300, 1000, 300)).toBe(0);
    expect(loop(1550, 1000, 300)).toBeCloseTo(0.25, 5);
    expect(mix("#ff0000", "#0000ff", 0.25)).toBe("#4000bf");
  });

  it("takes speed and pause from the nearest host", () => {
    const host = document.createElement("div");
    host.setAttribute("data-wp-motion-speed", "0.25");
    const el = document.createElement("canvas");
    host.append(el);
    expect(motionOf(el)).toEqual({ speed: 0.25, paused: false });
    host.setAttribute("data-wp-motion-paused", "true");
    expect(motionOf(el)).toEqual({ speed: 0.25, paused: true });
    expect(motionOf(document.createElement("canvas"))).toEqual({ speed: 1, paused: false });
  });
});
