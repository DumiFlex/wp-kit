import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// --wp-focus-ring is a whole box-shadow ("0 0 0 3px <colour>"). Wrapped in
// another shadow or used as an outline colour, the declaration is invalid
// and the piece shows no focus ring at all.
const SRC = join(__dirname, "..");
const BAD = /0 0 0 \dpx var\(--wp-focus-ring\)|outline:[^;]*var\(--wp-focus-ring\)|border(-color)?:[^;]*var\(--wp-focus-ring\)/;

describe("focus ring", () => {
  it("is used as a whole box-shadow everywhere", () => {
    const files = readdirSync(SRC).filter((f) => f.endsWith(".vue") || f.endsWith(".css"))
      .map((f) => join(SRC, f))
      .concat(readdirSync(join(SRC, "theme")).filter((f) => f.endsWith(".css")).map((f) => join(SRC, "theme", f)));
    const bad = files.flatMap((f) => readFileSync(f, "utf-8").split("\n")
      .map((line, i) => (BAD.test(line) ? `${f.slice(SRC.length + 1)}:${i + 1}` : null))
      .filter((x): x is string => x !== null));
    expect(bad).toEqual([]);
  });
});
