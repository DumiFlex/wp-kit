import { describe, expect, it } from "vitest";
import { aroundOf, aroundPoint, distOf, heightArc, heightOf, heightPoint, radiusOf, SIDE_CENTRE, snapAngle, wrapAngle } from "../orbit";

describe("orbit helpers", () => {
  it("folds angles into -180..180", () => {
    expect(wrapAngle(190)).toBe(-170);
    expect(wrapAngle(-180)).toBe(180);
    expect(wrapAngle(360)).toBe(0);
    expect(wrapAngle(-0)).toBe(0);
    expect(wrapAngle(Number.NaN)).toBe(0);
  });

  it("reads down as the front and right as 90", () => {
    expect(aroundOf(0, 10)).toBe(0);
    expect(aroundOf(10, 0)).toBe(90);
    expect(aroundOf(-10, 0)).toBe(-90);
    expect(aroundOf(0, -10)).toBe(180);
    expect(aroundOf(0, 0)).toBe(0);
  });

  it("snaps angles on their step and folds the result", () => {
    expect(snapAngle(52, 15)).toBe(45);
    expect(snapAngle(176, 15)).toBe(180);
    expect(snapAngle(-173, 15)).toBe(180);
    expect(snapAngle(12.3, 0)).toBe(12.3);
  });

  it("places points round the middle and back again", () => {
    const [x, y] = aroundPoint(90, 30);
    expect(x).toBeCloseTo(80);
    expect(y).toBeCloseTo(50);
    expect(aroundOf(x - 50, y - 50)).toBeCloseTo(90);
  });

  it("maps distance to a radius between the inner and outer ring", () => {
    expect(radiusOf(0, 0, 1, 10, 40)).toBe(10);
    expect(radiusOf(1, 0, 1, 10, 40)).toBe(40);
    expect(radiusOf(5, 0, 1, 10, 40)).toBe(40);
    expect(distOf(25, 0, 1, 10, 40)).toBeCloseTo(0.5);
    expect(distOf(0, 0, 1, 10, 40)).toBe(0);
    expect(radiusOf(1, 1, 1, 10, 40)).toBe(40);
  });

  it("reads the side view's height and clamps it", () => {
    const [x, y] = heightPoint(30, 20);
    expect(heightOf(x, y, -45, 90)).toBeCloseTo(30);
    expect(heightOf(SIDE_CENTRE[0], SIDE_CENTRE[1] - 10, -45, 60)).toBe(60);
    expect(heightOf(SIDE_CENTRE[0] + 10, SIDE_CENTRE[1] + 30, -20, 90)).toBe(-20);
    expect(heightOf(SIDE_CENTRE[0] - 10, SIDE_CENTRE[1] + 1, -45, 90)).toBe(90);
    expect(heightArc(0, 90, 20)).toMatch(/^M [\d.]+ [\d.]+ A 20 20 0 0 0 /);
  });
});
