import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mount } from "@vue/test-utils";
import WorkingLine from "../WorkingLine.vue";

describe("WorkingLine", () => {
  it("shows the word with an ellipsis, the time, and names itself", () => {
    const w = mount(WorkingLine, { props: { word: "Thinking", time: "12s", label: "Asking qwen3: thinking" } });
    expect(w.get("[data-test='working-line-word']").text()).toBe("Thinking…");
    expect(w.get("[data-test='working-line-time']").text()).toBe("12s");
    expect(w.get("[role='status']").attributes("aria-label")).toBe("Asking qwen3: thinking");
  });

  it("leaves the time out when none is given", () => {
    const w = mount(WorkingLine, { props: { word: "Writing" } });
    expect(w.find("[data-test='working-line-time']").exists()).toBe(false);
    expect(w.get("[role='status']").attributes("aria-label")).toBe("Writing");
  });

  it.each(["typing", "shuffle", "orbit", "burst"] as const)("draws the %s mark", (variant) => {
    const w = mount(WorkingLine, { props: { word: "Weaving", variant, tempo: "fast" } });
    const root = w.get(".wp-wl");
    expect(root.attributes("data-variant")).toBe(variant);
    expect(root.attributes("data-tempo")).toBe("fast");
    expect(w.findAll("svg path").length).toBeGreaterThan(0);
  });

  it("uses the community colours when asked", () => {
    const w = mount(WorkingLine, { props: { word: "x", brand: "community" } });
    expect(w.get(".wp-wl").attributes("style")).toContain("#da7550");
  });

  it("stays the still SVG in a test DOM, where there is no canvas", () => {
    const w = mount(WorkingLine, { props: { word: "x", variant: "orbit" } });
    expect(w.find("canvas").exists()).toBe(false);
    expect(w.findAll("svg circle")).toHaveLength(4);
  });

  it("keys no CSS animation on transform or opacity", () => {
    /** The body of every @keyframes block, found by matching braces. */
    const frames = (css: string): string[] => {
      const out: string[] = [];
      for (const m of css.matchAll(/@keyframes [\w-]+\s*\{/g)) {
        let depth = 1;
        let i = (m.index ?? 0) + m[0].length;
        const start = i;
        while (depth && i < css.length) {
          if (css[i] === "{") depth++;
          else if (css[i] === "}") depth--;
          i++;
        }
        out.push(css.slice(start, i - 1));
      }
      return out;
    };
    for (const file of ["../WorkingLine.vue", "../motion.css"]) {
      const bodies = frames(readFileSync(resolve(__dirname, file), "utf8"));
      expect(bodies.length).toBeGreaterThan(0);
      for (const b of bodies) expect(b).not.toMatch(/(^|[\s{;])(transform|opacity)\s*:/);
    }
  });
});
