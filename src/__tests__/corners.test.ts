/**
 * Every corner follows the look. Terminal and TUI set --wp-radius-cap: 0,
 * so a raw `border-radius: 50%` or `6px` stays round where everything else
 * went square. Corners are `min(Npx, var(--wp-radius-cap, 999px))`, pills
 * `var(--wp-radius-cap, 999px)`, circles `min(50%, var(--wp-radius-cap, 999px))`;
 * `0` and `inherit` are fine. looks.css sets corners per look on purpose.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC = resolve(process.cwd(), "src");

function files(dir: string, rel = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const r = rel ? `${rel}/${d.name}` : d.name;
    if (d.isDirectory()) return d.name === "__tests__" ? [] : files(join(dir, d.name), r);
    return /\.(vue|css)$/.test(d.name) && r !== "theme/looks.css" ? [r] : [];
  });
}

describe("corners", () => {
  it("every border-radius goes through --wp-radius-cap", () => {
    const raw: string[] = [];
    for (const f of files(SRC)) {
      const text = readFileSync(join(SRC, f), "utf8");
      for (const m of text.matchAll(/border(?:-[a-z]+)*-radius:\s*([^;}]+)/g)) {
        const v = (m[1] ?? "").trim();
        if (/^(0|inherit|initial|unset)\b/.test(v) || v.includes("--wp-radius")) continue;
        raw.push(`${f}: ${v}`);
      }
    }
    expect(raw).toEqual([]);
  });
});
