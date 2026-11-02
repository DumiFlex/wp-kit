import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import LoadingMark from "../LoadingMark.vue";

describe("LoadingMark", () => {
  it("is a status named Loading on its own", () => {
    const w = mount(LoadingMark);
    const root = w.get("[data-test='loading-mark']");
    expect(root.attributes("role")).toBe("status");
    expect(root.attributes("aria-label")).toBe("Loading");
    expect(w.get("svg").attributes("width")).toBe("14");
  });

  it("lets slot text name it", () => {
    const w = mount(LoadingMark, { props: { block: true, size: 40 }, slots: { default: "Loading bundle…" } });
    const root = w.get("[data-test='loading-mark']");
    expect(root.attributes("aria-label")).toBeUndefined();
    expect(root.classes()).toContain("wp-lm--block");
    expect(w.text()).toContain("Loading bundle…");
  });

  it("hides from screen readers when decorative", () => {
    const root = mount(LoadingMark, { props: { decorative: true } }).get("[data-test='loading-mark']");
    expect(root.attributes("role")).toBeUndefined();
    expect(root.attributes("aria-hidden")).toBe("true");
  });

  it("gives every mark its own gradient ids", () => {
    const a = mount(LoadingMark, { props: { block: true } }).get("linearGradient").attributes("id");
    const b = mount(LoadingMark, { props: { block: true } }).get("linearGradient").attributes("id");
    expect(a).not.toBe(b);
  });

  it("draws the sparkle inline and the full logo as a block", () => {
    expect(mount(LoadingMark).get("svg").attributes("data-variant")).toBe("sparkle");
    const block = mount(LoadingMark, { props: { block: true } }).get("svg");
    expect(block.attributes("data-variant")).toBe("logo");
    expect(block.attributes("width")).toBe("40");
    expect(mount(LoadingMark, { props: { size: 32 } }).get("svg").attributes("data-variant")).toBe("logo");
    expect(mount(LoadingMark, { props: { block: true, variant: "sparkle" } }).get("svg").attributes("data-variant")).toBe("sparkle");
  });

  it("draws in the text colour when mono", () => {
    const w = mount(LoadingMark, { props: { mono: true } });
    expect(w.findAll("path").every((p) => p.attributes("fill") === "currentColor")).toBe(true);
  });

  it("wears the community colours with brand=community", () => {
    const w = mount(LoadingMark, { props: { block: true, brand: "community" } });
    const html = w.html();
    expect(html).toContain("#da7550");
    expect(html).not.toContain("#a970ff");
  });

  it("keeps its only CSS animation (reduced motion) off the compositor", () => {
    // A keyframed `opacity` lifts the mark onto its own layer: it went soft.
    const css = readFileSync(resolve(__dirname, "../LoadingMark.vue"), "utf8");
    const frames = [...css.matchAll(/@keyframes [\w-]+ \{([\s\S]*?)\}\s*\}?/g)].map((m) => m[1] ?? "");
    expect(frames.length).toBeGreaterThan(0);
    for (const body of frames) {
      const props = [...body.matchAll(/([\w-]+)\s*:/g)].map((m) => m[1]);
      expect(props.filter((p) => !p?.startsWith("--wp-lm-"))).toEqual([]);
    }
    expect(css).toContain("@property --wp-lm-o ");
  });

  it("stays the still SVG in a test DOM, where there is no canvas", () => {
    const w = mount(LoadingMark, { props: { block: true } });
    expect(w.find("canvas").exists()).toBe(false);
    expect(w.get("[data-test='loading-mark']").classes()).not.toContain("wp-lm--drawn");
  });

  it("draws on a canvas over the SVG when motion is allowed, and stops on unmount", async () => {
    const mm = vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    vi.stubGlobal("matchMedia", mm);
    const ctx = fakeContext();
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => ctx as unknown as CanvasRenderingContext2D);
    const raf = vi.fn(() => 1);
    const caf = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("cancelAnimationFrame", caf);
    vi.stubGlobal("Path2D", function Path2D() { /* no shape needed */ });
    const ua = vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 Firefox/142.0");
    try {
      const w = mount(LoadingMark, { props: { size: 64 }, attachTo: document.body });
      await flushPromises();
      const c = w.get("canvas");
      // 64 px plus room for the rings: 64 × 1188 / 1024.
      expect(c.attributes("style")).toContain("width: 74.25px");
      expect(w.get("[data-test='loading-mark']").classes()).toContain("wp-lm--drawn");
      expect(ctx.fill).toHaveBeenCalled();
      expect(raf).toHaveBeenCalled();
      w.unmount();
      expect(caf).toHaveBeenCalled();
    } finally {
      getContext.mockRestore();
      ua.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it("keeps the still SVG under reduced motion", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const ua = vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 Firefox/142.0");
    try {
      const w = mount(LoadingMark, { props: { block: true } });
      await flushPromises();
      expect(w.find("canvas").exists()).toBe(false);
    } finally {
      ua.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});

function fakeContext(): Record<string, unknown> {
  const grad = { addColorStop: vi.fn() };
  const ctx: Record<string, unknown> = { createLinearGradient: vi.fn(() => grad) };
  for (const k of ["setTransform", "clearRect", "save", "restore", "translate", "rotate", "scale", "fill"]) ctx[k] = vi.fn();
  return ctx;
}
