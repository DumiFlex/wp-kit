/**
 * Icons in the kit use even pixel sizes. Every control height is even
 * (20/24/32/40), so an odd icon (11px, 13px) centres on a half pixel and
 * the browser snaps it one way: the icon sits visibly low or to one side.
 * This reads every `.pi` font-size rule and every `:size="N"` on an Icon.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC = resolve(process.cwd(), "src");

/** Odd sizes that sit in a line of text, not centred in a box. */
const ALLOW: Record<string, string> = {
  "theme/tokens.css .wp-syntax-pill .pi 9.5px": "inline with the pill's text",
  "WpNumber.vue .wp-cnum__btn .pi 7px": "stepper half-buttons are not whole-pixel boxes",
  "Input.vue :size=11": "the lock sits in the text line of a locked field",
  "PostCard.vue :size=11": "star and download counts sit inline with their numbers",
};

function files(dir: string, rel = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const r = rel ? `${rel}/${d.name}` : d.name;
    if (d.isDirectory()) return d.name === "__tests__" ? [] : files(join(dir, d.name), r);
    return /\.(vue|css)$/.test(d.name) ? [r] : [];
  });
}

const odd = (px: number): boolean => Math.round(px) !== px || px % 2 === 1;

describe("icon sizes", () => {
  it("are even pixels wherever an icon is centred in a box", () => {
    const found: string[] = [];
    for (const f of files(SRC)) {
      const text = readFileSync(join(SRC, f), "utf8");
      for (const m of text.matchAll(/([^{}\n]*\.pi\b[^{}\n]*)\{[^}]*?font-size:\s*([\d.]+)px/g)) {
        const px = Number(m[2]);
        if (odd(px)) found.push(`${f} ${(m[1] ?? "").trim()} ${m[2]}px`);
      }
      for (const m of text.matchAll(/<Icon\b[^>]*:size="(\d+)"/g)) {
        if (odd(Number(m[1]))) found.push(`${f} :size=${m[1]}`);
      }
    }
    expect([...new Set(found)].filter((k) => !(k in ALLOW))).toEqual([]);
  });
});
