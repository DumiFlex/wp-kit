import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/** Rules of a plain stylesheet as [selectors, body] with comments removed. */
function rules(css: string): Array<[string[], string]> {
  const out: Array<[string[], string]> = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = (m[1] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    out.push([sel, m[2] ?? ""]);
  }
  return out;
}

const css = readFileSync(resolve(__dirname, "../input.css"), "utf8");

describe("input.css", () => {
  // 0.15.4 put the textarea's scrollbar rule in the middle of the
  // `.wp-input, .wp-textarea` list, so a plain field lost its box.
  it.each([".wp-input", ".wp-textarea"])("%s keeps its box (border, fill, height)", (sel) => {
    const body = rules(css)
      .filter(([s]) => s.includes(sel))
      .map(([, b]) => b)
      .join(";");
    expect(body).toMatch(/border:\s*1px solid/);
    expect(body).toMatch(/background:/);
    expect(body).toMatch(/height:/);
  });
});
