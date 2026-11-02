/**
 * Rules inside `@layer wp-extension` lose to any unlayered host rule, and
 * Tailwind 3's preflight sets `border-width: 0` on every element unlayered.
 * So a layered rule never draws its outline with a border (use an inset
 * box-shadow ring, which nothing resets).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC = resolve(process.cwd(), "src");

/** The text of every `@layer wp-extension { … }` block, braces balanced. */
function layered(text: string): string[] {
  const out: string[] = [];
  let at = text.indexOf("@layer wp-extension");
  while (at >= 0) {
    const open = text.indexOf("{", at);
    let depth = 0;
    let i = open;
    for (; i < text.length; i += 1) {
      if (text[i] === "{") depth += 1;
      else if (text[i] === "}" && --depth === 0) break;
    }
    out.push(text.slice(open, i));
    at = text.indexOf("@layer wp-extension", i);
  }
  return out;
}

describe("layered rules", () => {
  it("draw no border a host reset could strip", () => {
    const found: string[] = [];
    for (const f of readdirSync(SRC).filter((x) => /\.(vue|css)$/.test(x))) {
      const css = readFileSync(join(SRC, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      for (const block of layered(css)) {
        for (const m of block.matchAll(/border(?:-(?:top|right|bottom|left))?(?:-width)?:\s*([^;}]+)/g)) {
          if (!/^(0|none)\b/.test((m[1] ?? "").trim())) found.push(`${f}: ${m[0].trim()}`);
        }
      }
    }
    expect(found).toEqual([]);
  });
});
