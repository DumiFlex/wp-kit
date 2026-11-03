import { describe, expect, it } from "vitest";
import { parseRichText, type RichSeg } from "../linkify";

/** Helper: collapse segments to `[kind, text]` tuples for terse assertions. */
function shape(segs: RichSeg[]): Array<[RichSeg["kind"], string]> {
  return segs.map((s) => [s.kind, s.text]);
}

describe("parseRichText", () => {
  it("returns one text segment for plain prose", () => {
    expect(parseRichText("just some words here")).toEqual([
      { kind: "text", text: "just some words here" },
    ]);
  });

  it("returns [] for empty input", () => {
    expect(parseRichText("")).toEqual([]);
  });

  it("links an explicit https URL, keeping its scheme as href", () => {
    const segs = parseRichText("https://example.com/path");
    expect(segs).toEqual([
      {
        kind: "link",
        text: "https://example.com/path",
        href: "https://example.com/path",
      },
    ]);
  });

  it("links a bare domain.tld/path and prefixes https://", () => {
    const segs = parseRichText("note.com/plum_code/n/ndca4832f2f1e");
    expect(segs).toEqual([
      {
        kind: "link",
        text: "note.com/plum_code/n/ndca4832f2f1e",
        href: "https://note.com/plum_code/n/ndca4832f2f1e",
      },
    ]);
  });

  it("peels a trailing period off the link", () => {
    const segs = parseRichText("see https://example.com/x.");
    expect(shape(segs)).toEqual([
      ["text", "see "],
      ["link", "https://example.com/x"],
      ["text", "."],
    ]);
    expect(segs[1]?.href).toBe("https://example.com/x");
  });

  it("peels a trailing close-paren off the link", () => {
    const segs = parseRichText("(https://example.com/x)");
    expect(shape(segs)).toEqual([
      ["text", "("],
      ["link", "https://example.com/x"],
      ["text", ")"],
    ]);
  });

  it("treats @{color} as a code token", () => {
    expect(parseRichText("@{color}")).toEqual([
      { kind: "code", text: "@{color}" },
    ]);
  });

  it("treats @{color:cool and dark} (spaces inside) as one code token", () => {
    expect(parseRichText("@{color:cool and dark}")).toEqual([
      { kind: "code", text: "@{color:cool and dark}" },
    ]);
  });

  it("treats $color as a code token", () => {
    expect(parseRichText("$color")).toEqual([
      { kind: "code", text: "$color" },
    ]);
  });

  it("treats $color.2 (accessor) as a code token", () => {
    expect(parseRichText("$color.2")).toEqual([
      { kind: "code", text: "$color.2" },
    ]);
  });

  it("orders a mixed sentence into the correct segments", () => {
    const segs = parseRichText(
      "Use $color with @{hue} — see https://example.com/docs for more",
    );
    expect(shape(segs)).toEqual([
      ["text", "Use "],
      ["code", "$color"],
      ["text", " with "],
      ["code", "@{hue}"],
      ["text", " — see "],
      ["link", "https://example.com/docs"],
      ["text", " for more"],
    ]);
  });

  it("leaves a non-URL abbreviation like e.g. as plain text", () => {
    // `e.g.` is a dotted token with NO `/path`, so it must NOT linkify.
    expect(parseRichText("e.g. this thing")).toEqual([
      { kind: "text", text: "e.g. this thing" },
    ]);
  });
});
