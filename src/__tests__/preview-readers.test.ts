import { describe, expect, it } from "vitest";
import {
  derivationRules,
  payloadFeatures,
  payloadKind,
  scanText,
  varFlow,
  wildcardAxes,
  wildcardOptions,
} from "../preview-readers";

function row(type: string, payload: Record<string, unknown>): Record<string, unknown> {
  return { id: "row1234", type, payload };
}

describe("preview readers", () => {
  it("treats a row with children and no type as a bundle", () => {
    expect(payloadKind({ children: [row("combine", {})] })).toBe("bundle");
    expect(payloadKind({})).toBeNull();
  });

  it("scans vars, $var.neg reads, refs and picks, brace arms included", () => {
    const s = scanText("$hair {$eyes|@{abcd1234}} $mood.neg");
    expect(s.vars).toContain("hair");
    expect(s.vars).toContain("eyes");
    expect(s.negVars).toEqual(["mood"]);
    expect(s.refs).toBe(1);
  });

  it("reads wildcard options and falls back to a flat tag axis", () => {
    const inner = {
      sub_categories: ["calm", "loud"],
      options: [{ value: "a", weight: 2, sub_categories: ["calm"], negative: "x" }, "bad"],
    };
    expect(wildcardOptions(inner)).toEqual([
      { value: "a", weight: 2, tags: ["calm"], negative: "x", fallback: false },
    ]);
    expect(wildcardOptions({ options: [{ value: "b", fallback: true }] })[0]?.fallback).toBe(true);
    expect(wildcardAxes(inner)).toEqual([{ name: "tag", tags: ["calm", "loud"] }]);
    expect(wildcardAxes({ tag_groups: { era: ["old"] } })).toEqual([{ name: "era", tags: ["old"] }]);
  });

  it("parses derivation branches, groups, extra actions and else", () => {
    const rules = derivationRules({
      rules: [
        {
          branches: [
            {
              condition: { match: "any", conditions: [{ var: "a", op: "exists" }] },
              action: { target_var: "x", mode: "replace", value: "1" },
              extra_actions: [{ target_var: "x", mode: "negative", value: "2" }],
            },
          ],
          else: { action: { target_var: "y", mode: "append", value: "3" } },
        },
      ],
    });
    expect(rules).toHaveLength(1);
    expect(rules[0]?.branches[0]?.condition).toMatchObject({ kind: "group", match: "any" });
    expect(rules[0]?.branches[0]?.actions.map((a) => a.op)).toEqual(["set", "neg_add"]);
    expect(rules[0]?.fallback?.map((a) => a.op)).toEqual(["append"]);
  });

  it("folds what a bundle sets, reads and sends to negatives", () => {
    const flow = varFlow({
      children: [
        row("wildcard", { var_binding: "hair", options: [{ value: "$color hair", negative: "bald" }] }),
        row("combine", { output_var: "scene", template: "$hair, $light" }),
      ],
    });
    expect(flow.sets).toEqual(["hair", "scene"]);
    expect(flow.reads).toEqual(expect.arrayContaining(["color", "hair", "light"]));
    expect(flow.negatives).toEqual(["hair"]);
  });

  it("lists feature pills in a stable order, bundle children included", () => {
    const features = payloadFeatures({
      children: [
        row("derivation", {
          rules: [
            {
              branches: [
                {
                  condition: { match: "all", conditions: [{ var: "a", op: "is_empty" }] },
                  action: { target_var: "b", mode: "replace", value: "$c.neg" },
                  extra_actions: [{ target_var: "b", mode: "negative", value: "d" }],
                },
              ],
            },
          ],
        }),
        row("constraint", {
          matrix: { r: { c: { mode: "only", factor: 1 } } },
          target_select: { mode: "next", count: 2 },
        }),
        row("wildcard", { tag_groups: { era: ["old"] }, options: [{ value: "x", weight: 3 }] }),
      ],
    });
    expect(features).toEqual([
      "tag axes",
      "weights",
      "negatives",
      "$var.neg",
      "AND / OR",
      "multi-action",
      "only rule",
      "reach: next 2",
    ]);
    expect(payloadFeatures(null)).toEqual([]);
  });
});
