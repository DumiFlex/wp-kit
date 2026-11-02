import { describe, expect, it } from "vitest";
import { highlight, highlightLanguage, highlightLines, type HighlightLanguage } from "../highlight";

const SAMPLES: Record<HighlightLanguage, string> = {
  json: '{\n  "name": "warm palette",\n  "weight": 1.5,\n  "on": true,\n  "tags": [null]\n}',
  ts: 'import Chip from "@dumiflex/wp-kit/Chip.vue";\n// a note\nconst n = count(3) + 1;',
  html: '<Chip :pressed="tag === t" size="sm" @click="pick(t)">{{ t }}</Chip>\n<!-- done -->',
  css: ".wp-chip:hover { color: var(--wp-text); padding: 2px 6px; }",
  sh: 'pnpm add @dumiflex/wp-kit vue # install\nnpm stage approve "abc" --otp $CODE',
  prompt: "$quality, {red|blue} hair, @{a1b2c3d4}, (smile:1.2), $$5",
};

const kinds = (code: string, lang: HighlightLanguage): Record<string, string[]> => {
  const out: Record<string, string[]> = {};
  for (const t of highlight(code, lang)) (out[t.kind] ??= []).push(t.text);
  return out;
};

describe("highlight", () => {
  it("gives every language back exactly the code it was given", () => {
    for (const [lang, code] of Object.entries(SAMPLES) as [HighlightLanguage, string][]) {
      expect(highlight(code, lang).map((t) => t.text).join("")).toBe(code);
    }
  });

  it("reads JSON keys, strings, numbers and literals", () => {
    const k = kinds(SAMPLES.json, "json");
    expect(k.key).toEqual(['"name"', '"weight"', '"on"', '"tags"']);
    expect(k.string).toEqual(['"warm palette"']);
    expect(k.number).toEqual(["1.5"]);
    expect(k.keyword).toEqual(["true", "null"]);
  });

  it("reads TS keywords, strings, comments and calls", () => {
    const k = kinds(SAMPLES.ts, "ts");
    expect(k.keyword).toEqual(["import", "from", "const"]);
    expect(k.string).toEqual(['"@dumiflex/wp-kit/Chip.vue"']);
    expect(k.comment).toEqual(["// a note"]);
    expect(k.fn).toEqual(["count"]);
  });

  it("reads Vue tags, attributes, values, mustaches and comments", () => {
    const k = kinds(SAMPLES.html, "html");
    expect(k.tag).toEqual(["Chip", "Chip"]);
    expect(k.attr).toEqual([":pressed", "size", "@click"]);
    expect(k.string).toEqual(['"tag === t"', '"sm"', '"pick(t)"']);
    expect(k.comment).toEqual(["<!-- done -->"]);
  });

  it("reads CSS selectors, properties, custom properties and values", () => {
    const k = kinds(SAMPLES.css, "css");
    expect(k.tag).toEqual([".wp-chip:hover"]);
    expect(k.key).toEqual(["color", "padding"]);
    expect(k.var).toEqual(["--wp-text"]);
    expect(k.number).toEqual(["2px", "6px"]);
  });

  it("reads shell commands, flags, strings, variables and comments", () => {
    const k = kinds(SAMPLES.sh, "sh");
    expect(k.fn).toEqual(["pnpm", "npm"]);
    expect(k.attr).toEqual(["--otp"]);
    expect(k.string).toEqual(['"abc"']);
    expect(k.var).toEqual(["$CODE"]);
    expect(k.comment).toEqual(["# install"]);
  });

  it("reads the template grammar", () => {
    const k = kinds(SAMPLES.prompt, "prompt");
    expect(k.var).toEqual(["$quality"]);
    expect(k.brace).toEqual(["{red|blue}"]);
    expect(k.ref).toEqual(["@{a1b2c3d4}"]);
    expect(k.number).toEqual(["1.2"]);
    expect(k.escape).toEqual(["$$"]);
  });

  it("maps language names and leaves unknown ones plain", () => {
    expect(highlightLanguage("JSON")).toBe("json");
    expect(highlightLanguage("Vue")).toBe("html");
    expect(highlightLanguage("Modelfile")).toBe("sh");
    expect(highlightLanguage("Template")).toBe("prompt");
    expect(highlightLanguage("Log")).toBeNull();
    expect(highlight("a < b", null)).toEqual([{ kind: "plain", text: "a < b" }]);
  });

  it("cuts tokens at line breaks for numbered lines", () => {
    const lines = highlightLines(highlight('{\n  "a": 1\n}', "json"));
    expect(lines.length).toBe(3);
    expect(lines[1]?.map((t) => t.kind)).toEqual(["plain", "key", "punct", "plain", "number"]);
  });
});
