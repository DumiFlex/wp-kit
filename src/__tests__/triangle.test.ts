import { describe, expect, it } from "vitest";
import { CORNERS, clampShares, pointOf, roundShares, shareLine, sharesAt } from "../triangle";

const close = (a: readonly number[], b: readonly number[]): void => a.forEach((v, i) => expect(v).toBeCloseTo(b[i] ?? NaN, 6));

describe("triangle", () => {
  it("gives each corner all of its share", () => {
    CORNERS.forEach(([x, y], i) => close(sharesAt(x, y), [0, 1, 2].map((j) => (j === i ? 1 : 0))));
  });
  it("gives the middle equal shares and goes back to the same point", () => {
    const mid = pointOf([1, 1, 1]);
    close(sharesAt(mid[0], mid[1]), [1 / 3, 1 / 3, 1 / 3]);
    const p = pointOf([60, 30, 10]);
    close(sharesAt(p[0], p[1]), [0.6, 0.3, 0.1]);
  });
  it("folds a point outside onto the triangle", () => {
    const s = sharesAt(0, 100);
    expect(s.every((v) => v >= 0)).toBe(true);
    expect(s[0] + s[1] + s[2]).toBeCloseTo(1, 9);
    expect(s[1]).toBeGreaterThan(0.9);
  });
  it("clamps bad shares to equal ones", () => {
    close(clampShares([0, 0, 0]), [1 / 3, 1 / 3, 1 / 3]);
    close(clampShares([Number.NaN, -1, 2]), [0, 0, 1]);
  });
  it("rounds to whole steps that still add up to the total", () => {
    expect(roundShares([1, 1, 1], 100, 5)).toEqual([35, 35, 30]);
    expect(roundShares([1, 1, 1], 100, 1)).toEqual([34, 33, 33]);
    expect(roundShares([0.62, 0.27, 0.11], 100, 5)).toEqual([65, 25, 10]);
    expect(roundShares([3, 1, 0], 1, 0.1)).toEqual([0.8, 0.2, 0]);
    const s = roundShares([0.2, 0.5, 0.3], 100, 0);
    expect(s[0] + s[1] + s[2]).toBeCloseTo(100, 9);
  });
  it("draws a share line between the corner's two edges", () => {
    const [x1, y1, x2, y2] = shareLine(0, 0.5);
    expect(y1).toBeCloseTo(y2, 9);
    expect(sharesAt(x1, y1)[0]).toBeCloseTo(0.5, 6);
    expect(sharesAt((x1 + x2) / 2, y1)[0]).toBeCloseTo(0.5, 6);
  });
});
