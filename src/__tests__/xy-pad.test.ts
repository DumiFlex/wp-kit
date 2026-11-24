import { describe, expect, it } from "vitest";
import { bandSpans, evenDots, guideLine, insideCircle, nearGuide, nearestStop, ratioName, stepDots } from "../xy-pad";

describe("xy-pad helpers", () => {
  it("stepDots puts one dot per step inside the range, or spreads them on steps", () => {
    expect(stepDots(0, 1, 0.25)).toEqual([0.25, 0.5, 0.75]);
    expect(stepDots(512, 1024, 64)).toEqual([576, 640, 704, 768, 832, 896, 960]);
    const many = stepDots(0, 100, 1, 4);
    expect(many).toEqual([20, 40, 60, 80]);
    // Past the limit: one every k steps, evenly spaced, and on a k that splits the range when one is close.
    expect(stepDots(0, 1, 0.05)).toEqual([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
    expect(stepDots(0, 1, 0.01)).toEqual([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
    expect(stepDots(0, 23, 1, 4)).toEqual([5, 10, 15, 20]);
    const gaps = (d: number[]): number[] => d.slice(1).map((v, i) => Number((v - (d[i] ?? 0)).toFixed(6)));
    expect(new Set(gaps(stepDots(512, 2048, 32))).size).toBe(1);
    expect(stepDots(0, 1, 1)).toEqual([]);
    expect(stepDots(1, 1, 0.1)).toEqual([]);
  });

  it("evenDots and nearestStop", () => {
    expect(evenDots(0, 10, 4)).toEqual([2, 4, 6, 8]);
    expect(nearestStop(3.2, [2, 4], 0, 10)).toBe(4);
    expect(nearestStop(0.4, [2, 4], 0, 10)).toBe(0);
    expect(nearestStop(9.9, [], 0, 10)).toBe(10);
  });

  it("bandSpans turns word ranges into stretches of the axis", () => {
    expect(bandSpans([{ to: 0.5, label: "calm" }, { to: 1, label: "wild" }], 0, 1)).toEqual([
      { from: 0, to: 50, label: "calm" },
      { from: 50, to: 100, label: "wild" },
    ]);
    // The last band always runs to the end; an empty one is dropped.
    expect(bandSpans([{ to: 0.2, label: "a" }, { to: 0.1, label: "b" }, { to: 0.5, label: "c" }], 0, 1).map((b) => b.label)).toEqual(["a", "c"]);
  });

  it("guideLine clips height = ratio × width to the pad", () => {
    expect(guideLine(1, 0, 100, 0, 100)).toEqual([0, 0, 100, 100]);
    expect(guideLine(1, 512, 2048, 512, 2048)).toEqual([0, 0, 100, 100]);
    expect(guideLine(2, 0, 100, 0, 100)).toEqual([0, 0, 50, 100]);
    expect(guideLine(10, 100, 200, 0, 100)).toBeNull();
  });

  it("ratioName and insideCircle", () => {
    expect(ratioName(4 / 3)).toBe("4:3");
    expect(ratioName(9 / 16)).toBe("9:16");
    expect(ratioName(1)).toBe("1:1");
    expect(insideCircle(50, 60)).toEqual([50, 60]);
    const [x, y] = insideCircle(100, 100);
    expect(Math.hypot(x - 50, y - 50)).toBeCloseTo(50);
  });
  it("nearGuide finds the guide line a point is near, in percent of the pad", () => {
    // 1024 × 600 on a 0..2048 pad is 0.8% off the 16:9 line (y = 0.5625 x).
    expect(nearGuide(1024, 600, [1, 0.5625], 0, 2048, 0, 2048)).toEqual({ x: expect.closeTo(1034, 0), ratio: 0.5625 });
    expect(nearGuide(1024, 1408, [1, 0.5625], 0, 2048, 0, 2048)).toBeNull();
    expect(nearGuide(1, 1, [1], 0, 0, 0, 1)).toBeNull();
  });
});
