import { describe, expect, it, vi } from "vitest";
import { TEMPO_MS, drawWorking, orbitNodes, type WorkingVariant } from "../working-line-motion";

function fakeContext(): CanvasRenderingContext2D & { calls: string[] } {
  const calls: string[] = [];
  const ctx: Record<string, unknown> = { calls, globalAlpha: 1, fillStyle: "" };
  for (const k of ["setTransform", "clearRect", "save", "restore", "translate", "rotate", "scale"]) ctx[k] = vi.fn(() => calls.push(k));
  ctx.fill = vi.fn(() => calls.push(`fill:${String(ctx.fillStyle)}@${String(ctx.globalAlpha)}`));
  return ctx as unknown as CanvasRenderingContext2D & { calls: string[] };
}

describe("working-line-motion", () => {
  it("mixes the orbit's middle nodes from the brand colours", () => {
    expect(orbitNodes(["#a970ff", "#6366f1", "#33d6c6"]).map((n) => n[2])).toEqual(["#33d6c6", "#41b4d3", "#8d6cf9", "#6366f1"]);
  });

  it.each([["typing", 3], ["shuffle", 3], ["orbit", 7], ["burst", 3]] as const)("draws every part of %s", (variant: WorkingVariant, parts) => {
    vi.stubGlobal("Path2D", function Path2D(this: { arc?: () => void }) { this.arc = () => undefined; });
    try {
      const ctx = fakeContext();
      drawWorking(ctx, 100, 700, variant, TEMPO_MS.mid, ["#a970ff", "#6366f1", "#33d6c6"]);
      expect(ctx.calls.filter((c) => c.startsWith("fill:"))).toHaveLength(parts);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("hides the burst's small stars at the loop's start, shows them mid-way", () => {
    vi.stubGlobal("Path2D", function Path2D() { /* no shape needed */ });
    try {
      const start = fakeContext();
      drawWorking(start, 100, 0, "burst", 1000, ["#111111", "#222222", "#333333"]);
      expect(start.calls.filter((c) => c.startsWith("fill:#222222"))).toEqual(["fill:#222222@0"]);
      const mid = fakeContext();
      drawWorking(mid, 100, 600, "burst", 1000, ["#111111", "#222222", "#333333"]);
      expect(mid.calls.filter((c) => c.startsWith("fill:#222222"))).toEqual(["fill:#222222@1"]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
