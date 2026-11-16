import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cancelLayout, flushLayout, pendingLayout, queueLayout } from "../layout-batch";

let frames: FrameRequestCallback[] = [];

beforeEach(() => {
  frames = [];
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => { frames.push(fn); return frames.length; });
});
afterEach(() => {
  flushLayout();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function runFrame(): void {
  const now = frames;
  frames = [];
  for (const fn of now) fn(0);
}

describe("layout-batch", () => {
  it("runs every prepare, then every measure, then every apply", () => {
    const log: string[] = [];
    for (let i = 0; i < 4; i++) {
      queueLayout({}, {
        prepare: () => log.push(`p${i}`),
        measure: () => log.push(`m${i}`),
        apply: () => log.push(`a${i}`),
      });
    }
    expect(log).toEqual([]);
    runFrame();
    expect(log).toEqual(["p0", "p1", "p2", "p3", "m0", "m1", "m2", "m3", "a0", "a1", "a2", "a3"]);
  });

  it("asks for one frame however many tasks are queued", () => {
    for (let i = 0; i < 50; i++) queueLayout({}, { measure: () => {} });
    expect(frames).toHaveLength(1);
    runFrame();
    expect(pendingLayout()).toBe(0);
  });

  it("keeps one task per key: a box queued five times is measured once", () => {
    const key = {};
    let measured = 0;
    const task = { measure: () => { measured++; } };
    for (let i = 0; i < 5; i++) queueLayout(key, task);
    runFrame();
    expect(measured).toBe(1);
  });

  it("runs work queued by an apply in the same frame, after the first round", () => {
    const log: string[] = [];
    const key = {};
    queueLayout(key, {
      measure: () => log.push("m1"),
      apply: () => {
        log.push("a1");
        queueLayout(key, { measure: () => log.push("m2"), apply: () => log.push("a2") });
      },
    });
    queueLayout({}, { measure: () => log.push("other") });
    runFrame();
    expect(log).toEqual(["m1", "other", "a1", "m2", "a2"]);
    expect(frames).toHaveLength(0);
  });

  it("stops a task that re-queues forever after a few rounds and carries on next frame", () => {
    const key = {};
    let rounds = 0;
    const task = { apply: () => { rounds++; queueLayout(key, task); } };
    queueLayout(key, task);
    runFrame();
    expect(rounds).toBe(4);
    expect(frames).toHaveLength(1);
    cancelLayout(key);
    runFrame();
    expect(rounds).toBe(4);
  });

  it("drops a cancelled task", () => {
    const key = {};
    let ran = false;
    queueLayout(key, { measure: () => { ran = true; } });
    cancelLayout(key);
    runFrame();
    expect(ran).toBe(false);
  });

  it("keeps going past a task that throws, and reports the error afterwards", () => {
    vi.useFakeTimers();
    const log: string[] = [];
    queueLayout({}, { measure: () => { throw new Error("boom"); } });
    queueLayout({}, { measure: () => log.push("m"), apply: () => log.push("a") });
    runFrame();
    expect(log).toEqual(["m", "a"]);
    expect(() => vi.runAllTimers()).toThrow("boom");
  });

  it("runs at once where there is no requestAnimationFrame", () => {
    vi.stubGlobal("requestAnimationFrame", undefined);
    let ran = false;
    queueLayout({}, { measure: () => { ran = true; } });
    expect(ran).toBe(true);
  });
});
