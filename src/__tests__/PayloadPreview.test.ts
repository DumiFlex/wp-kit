import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import PayloadPreview from "../PayloadPreview.vue";
import TokenizedValue from "../TokenizedValue.vue";

/** UUID used across the ref-token cases (matches TokenizedValue.test.ts). */
const GEM_UUID = "c0f09840";

/** Wrap a type-specific dict in the canonical engine-row shape the
 *  preview reads (`{ id, type, name, payload: {...} }`). Mirrors
 *  `seed_local.py` + sister `_row_to_module`. */
function row(type: string, payload: Record<string, unknown>): Record<string, unknown> {
  return { id: "row1234", type, name: `seed-${type}`, payload };
}

describe("PayloadPreview — constraint", () => {
  const matrix = {
    soft: {
      bold: { mode: "boost", factor: 3 },
      soft: { mode: "reduce", factor: 0.3 },
    },
    bold: {
      bold: { mode: "exclude", factor: 0 },
      soft: { mode: "allow", factor: 1 },
    },
  };

  it("renders the matrix grid with cached axis names + per-mode cell glyphs", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("constraint", {
          source_wildcard_id: "aaaa1111",
          target_wildcard_id: "bbbb2222",
          source_wildcard_name: "Hair style",
          target_wildcard_name: "Outfit",
          matrix,
          exceptions: [],
        }),
      },
    });
    // Axis tags resolve to the cached wildcard NAMES (not the uuids).
    const src = wrap.find(".wp-cn-axis--src");
    const tgt = wrap.find(".wp-cn-axis--tgt");
    expect(src.exists()).toBe(true);
    expect(tgt.exists()).toBe(true);
    expect(src.text()).toContain("Hair style");
    expect(tgt.text()).toContain("Outfit");
    expect(src.text()).not.toContain("aaaa1111");

    // One cell per (row, col). The bold→bold cell is an exclude.
    const cells = wrap.findAll(".wp-cn-cell");
    expect(cells.length).toBe(4);
    const exclude = wrap.find('.wp-cn-cell[data-mode="exclude"]');
    expect(exclude.exists()).toBe(true);
    expect(exclude.text()).toContain("×");

    // Boost cell shows ↑ + the rounded factor; reduce shows ↓.
    const boost = wrap.find('.wp-cn-cell[data-mode="boost"]');
    expect(boost.exists()).toBe(true);
    expect(boost.text()).toContain("↑");
    expect(boost.text()).toContain("3");
    const reduce = wrap.find('.wp-cn-cell[data-mode="reduce"]');
    expect(reduce.exists()).toBe(true);
    expect(reduce.text()).toContain("↓");

    // A legend row is present below the grid, and each glyph is tagged
    // with its mode so it can be colored to match the matrix cells.
    expect(wrap.find(".wp-cn-legend").exists()).toBe(true);
    expect(wrap.find('.wp-cn-legend [data-mode="boost"]').exists()).toBe(true);
    expect(wrap.find('.wp-cn-legend [data-mode="reduce"]').exists()).toBe(true);
    expect(wrap.find('.wp-cn-legend [data-mode="exclude"]').exists()).toBe(true);
    expect(wrap.find('.wp-cn-legend [data-mode="neutral"]').exists()).toBe(true);

    // No redundant kind chip inside the head; the head still carries the
    // source→target axes.
    expect(wrap.find(".wp-cn-kind").exists()).toBe(false);
    const head = wrap.find(".wp-cn-head");
    expect(head.text()).not.toContain("constraint");
    expect(head.find(".wp-cn-axis--src").exists()).toBe(true);
    expect(head.find(".wp-cn-axis--tgt").exists()).toBe(true);
    wrap.unmount();
  });

  it("falls back to the uuid when no cached wildcard name is present", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("constraint", {
          source_wildcard_id: "aaaa1111",
          target_wildcard_id: "bbbb2222",
          matrix,
          exceptions: [],
        }),
      },
    });
    expect(wrap.find(".wp-cn-axis--src").text()).toContain("aaaa1111");
    expect(wrap.find(".wp-cn-axis--tgt").text()).toContain("bbbb2222");
    wrap.unmount();
  });

  it("renders library exceptions as mode-chip rows and IGNORES extra_exceptions", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("constraint", {
          source_wildcard_id: "aaaa1111",
          target_wildcard_id: "bbbb2222",
          matrix,
          exceptions: [
            { source: "red", target: "hat", mode: "exclude", factor: 1 },
            { source: "blue", target: "scarf", mode: "boost", factor: 2.5 },
          ],
          // A stray instance-only field — the published payload never
          // carries it; the community preview MUST ignore it entirely.
          extra_exceptions: [
            { source_value: "ghost", target_value: "row", mode: "allow", factor: 1 },
          ],
        }),
      },
    });
    const rows = wrap.findAll(".wp-cn-exc-row");
    expect(rows.length).toBe(2);
    // First row: exclude chip; second: boost chip + ×2.5 factor.
    const modes = wrap.findAll(".wp-cn-exc__mode");
    expect(modes[0]?.text().toLowerCase()).toContain("exclude");
    expect(modes[1]?.text().toLowerCase()).toContain("boost");
    expect(wrap.text()).toContain("2.5");
    // The values render (red → hat, blue → scarf).
    expect(wrap.text()).toContain("red");
    expect(wrap.text()).toContain("scarf");
    // No extra-exception markup, and the stray value never leaks in.
    expect(wrap.find(".wp-cn-extra").exists()).toBe(false);
    expect(wrap.text()).not.toContain("ghost");
    wrap.unmount();
  });

  it("tokenizes @{ref} tokens inside exception values", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("constraint", {
          source_wildcard_id: "aaaa1111",
          target_wildcard_id: "bbbb2222",
          matrix,
          exceptions: [
            { source: `a @{${GEM_UUID}}`, target: "plain", mode: "allow", factor: 1 },
          ],
        }),
      },
    });
    // The @{uuid} in the exception source renders as a ref chip.
    expect(wrap.find(".wp-tv-ref").exists()).toBe(true);
    wrap.unmount();
  });

  it("shows a minor target_select badge when present", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("constraint", {
          source_wildcard_id: "aaaa1111",
          target_wildcard_id: "bbbb2222",
          matrix,
          exceptions: [],
          target_select: { mode: "next", count: 2 },
        }),
      },
    });
    const badge = wrap.find(".wp-cn-target-select");
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toContain("next");
    wrap.unmount();
  });

  it("resolves axis uuids to names via the refNames map (no cached name)", () => {
    // Published payload carries only the uuids — no source/target
    // _wildcard_name. The refNames map (built from the post's deps)
    // resolves them to readable names.
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("constraint", {
          source_wildcard_id: "aaaa1111",
          target_wildcard_id: "bbbb2222",
          matrix,
          exceptions: [],
        }),
        refNames: {
          aaaa1111: "Starter subject",
          bbbb2222: "Outfit palette",
        },
      },
    });
    const src = wrap.find(".wp-cn-axis--src");
    const tgt = wrap.find(".wp-cn-axis--tgt");
    expect(src.text()).toContain("Starter subject");
    expect(tgt.text()).toContain("Outfit palette");
    expect(src.text()).not.toContain("aaaa1111");
    wrap.unmount();
  });

  it("falls back to the uuid when neither cached name nor refNames resolve", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("constraint", {
          source_wildcard_id: "aaaa1111",
          target_wildcard_id: "bbbb2222",
          matrix,
          exceptions: [],
        }),
        refNames: { someother: "Unrelated" },
      },
    });
    expect(wrap.find(".wp-cn-axis--src").text()).toContain("aaaa1111");
    expect(wrap.find(".wp-cn-axis--tgt").text()).toContain("bbbb2222");
    wrap.unmount();
  });

  it("prefers a cached source_wildcard_name over the refNames map", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("constraint", {
          source_wildcard_id: "aaaa1111",
          target_wildcard_id: "bbbb2222",
          source_wildcard_name: "Cached source",
          matrix,
          exceptions: [],
        }),
        refNames: { aaaa1111: "Map source", bbbb2222: "Map target" },
      },
    });
    const src = wrap.find(".wp-cn-axis--src");
    // Cached name wins for the source; the target (no cached name) still
    // resolves through the map.
    expect(src.text()).toContain("Cached source");
    expect(src.text()).not.toContain("Map source");
    expect(wrap.find(".wp-cn-axis--tgt").text()).toContain("Map target");
    wrap.unmount();
  });

  it("resolves a nested @{uuid} ref inside a value string via refNames", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("constraint", {
          source_wildcard_id: "aaaa1111",
          target_wildcard_id: "bbbb2222",
          matrix,
          exceptions: [
            { source: `pick @{aaaa1111}`, target: "plain", mode: "allow", factor: 1 },
          ],
        }),
        refNames: { aaaa1111: "Starter subject" },
      },
    });
    // The @{uuid} ref chip resolves to the mapped name, not the bare uuid.
    const ref = wrap.find(".wp-tv-ref");
    expect(ref.exists()).toBe(true);
    expect(ref.text()).toContain("Starter subject");
    wrap.unmount();
  });

  it("groups the matrix by the source/target wildcards' tag_groups (refGroups)", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("constraint", {
          source_wildcard_id: "aaaa1111",
          target_wildcard_id: "bbbb2222",
          matrix: { happy: { warm: { mode: "boost", factor: 2 } } },
          exceptions: [],
        }),
        refNames: { aaaa1111: "Mood", bbbb2222: "Hue" },
        refGroups: {
          aaaa1111: { mood: ["happy"] },
          bbbb2222: { hue: ["warm"] },
        },
      },
    });
    // The target wildcard's "hue" axis becomes a column band — the grouped
    // layout replaced the flat header.
    expect(wrap.find(".wp-cn-band").exists()).toBe(true);
    expect(wrap.html()).toContain("hue");
    wrap.unmount();
  });

  it("stays flat (no bands) when the dep wildcards carry no tag_groups", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("constraint", {
          source_wildcard_id: "aaaa1111",
          target_wildcard_id: "bbbb2222",
          matrix: { happy: { warm: { mode: "boost", factor: 2 } } },
          exceptions: [],
        }),
        refNames: { aaaa1111: "Mood", bbbb2222: "Hue" },
        // no refGroups → back-compat flat matrix
      },
    });
    expect(wrap.find(".wp-cn-band").exists()).toBe(false);
    expect(wrap.find(".wp-cn-axis--src").text()).toContain("Mood");
    wrap.unmount();
  });

  it("groups by the constraint's OWN embedded source_groups/target_groups (self-contained, no refGroups)", () => {
    // A standalone constraint whose referenced wildcards are NOT published:
    // the SPA stamps the axis snapshot into the payload so the preview still
    // groups + colours without resolving any dependency.
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("constraint", {
          source_wildcard_id: "aaaa1111",
          target_wildcard_id: "bbbb2222",
          source_wildcard_name: "Mood",
          target_wildcard_name: "Color",
          matrix: { bold: { vivid: { mode: "boost", factor: 2 }, light: { mode: "reduce", factor: 0.5 } } },
          source_groups: { tone: ["bold"] },
          target_groups: { saturation: ["vivid"], brightness: ["light"] },
          exceptions: [],
        }),
        // NO refNames / refGroups — the embedded groups must drive it.
      },
    });
    expect(wrap.find(".wp-cn-band").exists()).toBe(true);
    expect(wrap.html()).toContain("saturation");
    expect(wrap.html()).toContain("brightness");
    wrap.unmount();
  });
  it("keeps the v6 only mode on cells and exceptions (not coerced to neutral)", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("constraint", {
          source_wildcard_id: "aaaa1111",
          target_wildcard_id: "bbbb2222",
          matrix: {
            summer: { open: { mode: "only", factor: 1 }, closed: { mode: "allow", factor: 1 } },
          },
          exceptions: [{ source_value: "beach", target_value: "sandals", mode: "only", factor: 1 }],
        }),
        refNames: { aaaa1111: "Season", bbbb2222: "Shoes" },
      },
    });
    expect(wrap.find('.wp-cn-cell[data-mode="only"]').exists()).toBe(true);
    expect(wrap.find(".wp-cn-cell--implied-out").exists()).toBe(true);
    expect(wrap.find(".wp-cn-exc__mode--only").exists()).toBe(true);
    wrap.unmount();
  });
});

describe("PayloadPreview — wildcard", () => {
  it("groups options by their plural sub_categories (real published shape)", () => {
    // Real DB shape: each option carries `sub_categories: string[]` (an
    // option may be tagged into several groups). This is the regression
    // that caught the empty `FELINE 0 / CANINE 0` render.
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("wildcard", {
          var_binding: "mood",
          sub_categories: ["calm", "intense"],
          options: [
            { id: "a1", value: "serene", weight: 1, sub_categories: ["calm"] },
            { id: "a2", value: "fierce", weight: 1, sub_categories: ["intense"] },
          ],
        }),
      },
    });
    const groups = wrap.findAll(".wp-wildcard-group");
    expect(groups.length).toBe(2);
    // Each group head shows its name + a non-zero count, and its option
    // value renders inside it (not an empty `calm 0` shell).
    const calm = groups[0];
    const intense = groups[1];
    expect(calm?.find(".wp-disclosure__trigger").text()).toContain("calm");
    expect(calm?.find(".wp-pv-group__count").text()).toContain("1");
    expect(calm?.text()).toContain("serene");
    expect(intense?.find(".wp-disclosure__trigger").text()).toContain("intense");
    expect(intense?.text()).toContain("fierce");
    // No option leaked into the wrong group.
    expect(calm?.text()).not.toContain("fierce");
    wrap.unmount();
  });

  it("files a multi-tagged option once, under its first tag, and lists every tag", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("wildcard", {
          var_binding: "mood",
          sub_categories: ["calm", "intense"],
          options: [
            { id: "a1", value: "balanced", weight: 1, sub_categories: ["calm", "intense"] },
          ],
        }),
      },
    });
    // Once only, so the per-group "% of draws" adds up to 100.
    const groups = wrap.findAll(".wp-wildcard-group");
    expect(groups.length).toBe(1);
    expect(groups[0]?.find(".wp-disclosure__trigger").text()).toContain("calm");
    expect(wrap.findAll(".wp-wildcard-option").length).toBe(1);
    expect(wrap.findAll(".wp-wc__tag").map((t) => t.text())).toEqual(["calm", "intense"]);
    wrap.unmount();
  });

  it("falls back to a singular sub_category string (back-compat)", () => {
    // Legacy/alt shape: an option with a singular `sub_category` string
    // (no plural array) still groups under that name.
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("wildcard", {
          var_binding: "subject",
          sub_categories: ["base"],
          options: [{ value: "plain", weight: 1, sub_category: "base" }],
        }),
      },
    });
    const groups = wrap.findAll(".wp-wildcard-group");
    expect(groups.length).toBe(1);
    expect(groups[0]?.find(".wp-pv-group__count").text()).toContain("1");
    expect(groups[0]?.text()).toContain("plain");
    wrap.unmount();
  });

  it("renders an option value through TokenizedValue (ref chip present)", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("wildcard", {
          var_binding: "subject",
          sub_categories: ["base"],
          options: [
            { id: "a1", value: `a @{${GEM_UUID}}`, weight: 1, sub_categories: ["base"] },
            { id: "a2", value: "plain", weight: 2, sub_categories: ["base"] },
          ],
        }),
      },
    });
    // The grouped option value with a @{ref} renders a TokenizedValue ref chip.
    expect(wrap.findComponent(TokenizedValue).exists()).toBe(true);
    expect(wrap.find(".wp-tv-ref").exists()).toBe(true);
    // The ×weight suffix survives for the weight≠1 option.
    expect(wrap.text()).toContain("×2");
    wrap.unmount();
  });

  it("renders ungrouped options when no sub_categories are declared", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("wildcard", {
          var_binding: "subject",
          options: [
            { id: "a1", value: "alpha", weight: 1 },
            { id: "a2", value: "beta", weight: 1 },
          ],
        }),
      },
    });
    const groups = wrap.findAll(".wp-wildcard-group");
    expect(groups.length).toBe(1);
    // No group head when there's no sub-category name.
    expect(groups[0]?.find(".wp-disclosure__trigger").exists()).toBe(false);
    expect(groups[0]?.text()).toContain("alpha");
    expect(groups[0]?.text()).toContain("beta");
    wrap.unmount();
  });
});

describe("PayloadPreview — derivation", () => {
  it("tokenizes the action value but keeps the condition as raw text", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("derivation", {
          rules: [
            {
              branches: [
                {
                  condition: { var: "mood", op: "equals", value: "dramatic" },
                  action: {
                    target_var: "accent",
                    mode: "replace",
                    value: `glow @{${GEM_UUID}}`,
                  },
                },
              ],
              else: {
                action: { target_var: "accent", mode: "replace", value: "soft" },
              },
            },
          ],
        }),
      },
    });
    // The action's @{ref} value becomes a ref chip via TokenizedValue.
    expect(wrap.find(".wp-tv-ref").exists()).toBe(true);
    // The condition stays raw — the var/op/value text is present verbatim.
    expect(wrap.text()).toContain("mood");
    expect(wrap.text()).toContain("equals");
    expect(wrap.text()).toContain("dramatic");
    wrap.unmount();
  });

  it("renders an AND / OR condition group inline", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("derivation", {
          rules: [
            {
              branches: [
                {
                  condition: {
                    match: "all",
                    conditions: [
                      { var: "time", op: "equals", value: "night" },
                      {
                        match: "any",
                        conditions: [
                          { var: "weather", op: "equals", value: "rain" },
                          { var: "weather", op: "equals", value: "fog" },
                        ],
                      },
                    ],
                  },
                  action: { target_var: "light", mode: "replace", value: "moody" },
                },
              ],
            },
          ],
        }),
      },
    });
    const groups = wrap.findAll('[data-test="derivation-group"]');
    expect(groups.map((g) => g.attributes("data-match"))).toEqual(["all", "any"]);
    expect(groups[0]?.text()).toContain("ALL OF");
    expect(groups[1]?.text()).toContain("ANY OF");
    expect(wrap.findAll('[data-test="derivation-test"]').map((t) => t.text())).toEqual([
      "time equals night",
      "weather equals rain",
      "weather equals fog",
    ]);
    wrap.unmount();
  });
});

describe("PayloadPreview — bundle", () => {
  it("resolves a constraint child's source/target axis tags via siblings", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: {
          children: [
            { id: "wild1111", type: "wildcard", meta: { name: "Hair" }, payload: {} },
            { id: "wild2222", type: "wildcard", meta: { name: "Outfit" }, payload: {} },
            {
              id: "cstr3333",
              type: "constraint",
              meta: { name: "pairing" },
              payload: {
                source_wildcard_id: "wild1111",
                target_wildcard_id: "wild2222",
                matrix: {},
                exceptions: [],
              },
            },
          ],
        },
      },
    });
    // The constraint child resolves its refs to the sibling display names.
    expect(wrap.text()).toContain("Hair");
    expect(wrap.text()).toContain("Outfit");
    // Each child carries its kind icon (constraint → pi pi-filter).
    expect(wrap.find("i.pi-filter").exists()).toBe(true);
    // A bundle row has no top-level `type`; `children` alone makes it one.
    expect(wrap.findAll('[data-test="bundle-child"]').length).toBe(3);
    wrap.unmount();
  });
});

describe("PayloadPreview — send-to-negative (schema v8)", () => {
  it("shows an option's negative beside its value, and none when absent", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("wildcard", {
          var_binding: "hair",
          options: [
            { id: "a1", value: "strawberry blonde", weight: 1, negative: "strawberry, fruit" },
            { id: "a2", value: "platinum bob", weight: 1 },
          ],
        }),
      },
    });
    const negs = wrap.findAll("[data-test='option-negative']");
    expect(negs.length).toBe(1);
    expect(negs[0]?.text()).toContain("strawberry, fruit");
    wrap.unmount();
  });

  it("tokenizes a ref inside an option negative", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("wildcard", {
          var_binding: "hair",
          options: [{ id: "a1", value: "red", weight: 1, negative: `@{${GEM_UUID}}` }],
        }),
      },
    });
    expect(wrap.find("[data-test='option-negative'] .wp-tv-ref").exists()).toBe(true);
    wrap.unmount();
  });

  it("shows fixed value and combine negatives", () => {
    const fixed = mount(PayloadPreview, {
      props: {
        payload: row("fixed_values", {
          values: [{ id: "v1", name: "style", value: "oil painting", negative: "photo" }],
        }),
      },
    });
    expect(fixed.find("[data-test='fixed-negative']").text()).toContain("photo");
    fixed.unmount();

    const combine = mount(PayloadPreview, {
      props: {
        payload: row("combine", {
          template: "$hair hair",
          output_var: "scene",
          negative: "cropped",
        }),
      },
    });
    expect(combine.find("[data-test='combine-negative']").text()).toContain("cropped");
    combine.unmount();
  });

  it("labels an Add to negative derivation action", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("derivation", {
          rules: [
            {
              branches: [
                {
                  condition: { var: "mood", op: "equals", value: "gloomy" },
                  action: { target_var: "mood", mode: "negative", value: "bright colors" },
                },
              ],
            },
          ],
        }),
      },
    });
    const step = wrap.find('[data-test="derivation-action"]');
    expect(step.find(".wp-dv-op").text()).toBe("+ NEGATIVE");
    expect(step.find(".wp-derivation__target").text()).toBe("mood");
    wrap.unmount();
  });
});

describe("PayloadPreview — derivation multi-action (schema v8)", () => {
  it("lists every action of a branch and an else, in order", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("derivation", {
          rules: [
            {
              branches: [
                {
                  condition: { var: "mood", op: "equals", value: "dark" },
                  action: { target_var: "light", mode: "replace", value: "rim light" },
                  extra_actions: [
                    { target_var: "light", mode: "negative", value: "flat light" },
                    { target_var: "light", mode: "negative_replace", value: "overexposed" },
                  ],
                },
              ],
              else: {
                action: { target_var: "light", mode: "replace", value: "natural" },
                extra_actions: [{ target_var: "tone", mode: "append", value: ", warm" }],
              },
            },
          ],
        }),
      },
    });
    const steps = wrap
      .findAll('[data-test="derivation-action"]')
      .map((s) => `${s.find(".wp-dv-op").text()} ${s.find(".wp-derivation__target").text()}`);
    expect(steps).toEqual([
      "SET light",
      "+ NEGATIVE light",
      "REPLACE NEG light",
      "SET light",
      "APPEND tone",
    ]);
    // The else branch is labelled and numbered on its own.
    expect(wrap.find(".wp-derivation__branch.is-else").text()).toContain("ELSE");
  });

  it("shows presence checks without a value", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("derivation", {
          rules: [
            {
              branches: [
                {
                  condition: { var: "acc", op: "is_empty", value: "" },
                  action: { target_var: "acc", mode: "replace", value: "hat" },
                },
              ],
            },
          ],
        }),
      },
    });
    expect(wrap.find('[data-test="derivation-test"]').text()).toBe("acc is empty");
  });
});

describe("PayloadPreview — big wildcards", () => {
  const options = Array.from({ length: 40 }, (_, i) => ({
    value: i === 3 ? `long ${"x".repeat(120)}` : `opt-${i}`,
    weight: 1,
    sub_categories: [i < 30 ? "a" : i < 35 ? "b" : i < 38 ? "c" : "d"],
  }));
  const payload = row("wildcard", {
    var_binding: "w",
    sub_categories: ["a", "b", "c", "d"],
    options,
  });

  it("pages a group behind Show more, and opens only the first two groups", async () => {
    const wrap = mount(PayloadPreview, { props: { payload } });
    // a (30 → page of 8) + b (5); c and d start closed.
    expect(wrap.findAll(".wp-wildcard-option").length).toBe(8 + 5);
    const more = wrap.find('[data-test="more-a"]');
    expect(more.text()).toContain("22 more");
    await more.trigger("click");
    expect(wrap.findAll(".wp-wildcard-option").length).toBe(30 + 5);
    await wrap.find('[data-test="group-c"]').trigger("click");
    await wrap.find('[data-test="group-d"]').trigger("click");
    expect(wrap.findAll(".wp-wildcard-option").length).toBe(40);
  });

  it("filters options by search across every group", async () => {
    const wrap = mount(PayloadPreview, { props: { payload } });
    await wrap.find('[data-test="wildcard-search"]').setValue("opt-3");
    // opt-30..opt-39 (index 3 is the long option) → 10 matches, all shown,
    // closed groups opened.
    expect(wrap.findAll(".wp-wildcard-option").length).toBe(10);
    expect(wrap.find('[data-test="wildcard-matches"]').text()).toContain("10 of 40");
  });

  it("clamps a long option until it is clicked", async () => {
    const wrap = mount(PayloadPreview, { props: { payload } });
    const long = () => wrap.find(".wp-wildcard-option__value[data-long]");
    expect(long().classes()).toContain("wp-pv-clamp");
    const toggle = wrap.findAll(".wp-wildcard-option button").find((b) => b.text() === "Show all");
    await toggle?.trigger("click");
    expect(long().classes()).not.toContain("wp-pv-clamp");
  });
});

describe("PayloadPreview — bundle children expand", () => {
  it("shows the first child's own preview, and switches on click", async () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: {
          id: "b1",
          name: "kit",
          children: [
            row("fixed_values", { values: [{ id: "v1", name: "q", value: "sharp" }] }),
            { ...row("fixed_values", { values: [{ id: "v2", name: "t", value: "warm" }] }), id: "row5678" },
          ],
        },
      },
    });
    const body = () => wrap.find('[data-test="bundle-child-body"]');
    expect(body().text()).toContain("sharp");
    expect(body().find('[role="tablist"]').exists()).toBe(false);
    await wrap.findAll('[data-test="bundle-child"]')[1]?.trigger("click");
    expect(body().text()).toContain("warm");
    expect(body().text()).not.toContain("sharp");
  });
});

describe("PayloadPreview — big fixed values, combine and constraint", () => {
  it("searches and pages fixed values", async () => {
    const values = Array.from({ length: 25 }, (_, i) => ({ id: `v${i}`, name: `n${i}`, value: `val-${i}` }));
    const wrap = mount(PayloadPreview, { props: { payload: row("fixed_values", { values }) } });
    expect(wrap.findAll('[data-test="fixed-row"]').length).toBe(10);
    await wrap.find('[data-test="fixed-more"]').trigger("click");
    expect(wrap.findAll('[data-test="fixed-row"]').length).toBe(25);
    await wrap.find('[data-test="fixed-search"]').setValue("val-2");
    // val-2, val-20..24
    expect(wrap.findAll('[data-test="fixed-row"]').length).toBe(6);
  });

  it("shows a combine's template and where each input is used", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("combine", { template: "$hair, $eyes", output_var: "scene", input_vars: ["hair", "eyes"] }),
      },
    });
    expect(wrap.find('[data-test="combine-template"]').text()).toContain("hair");
    expect(wrap.findAll('[data-test="combine-input"]').length).toBe(2);
    expect(wrap.find('[data-test="combine-negative"]').exists()).toBe(false);
  });

  it("offers a filterable rules list for a big matrix", async () => {
    const rowsN = Array.from({ length: 9 }, (_, i) => `s${i}`);
    const colsN = Array.from({ length: 9 }, (_, i) => `t${i}`);
    const matrix: Record<string, Record<string, { mode: string; factor: number }>> = {};
    for (const r of rowsN) {
      const cells: Record<string, { mode: string; factor: number }> = {};
      for (const c of colsN) cells[c] = { mode: "allow", factor: 1 };
      if (r === "s1") cells.t2 = { mode: "exclude", factor: 0 };
      if (r === "s3") cells.t4 = { mode: "boost", factor: 2 };
      matrix[r] = cells;
    }
    const wrap = mount(PayloadPreview, { props: { payload: row("constraint", { matrix, exceptions: [] }) } });
    await wrap.find('[data-test="constraint-list"]').trigger("click");
    expect(wrap.findAll('[data-test="constraint-rule"]').length).toBe(2);
    await wrap.find('[data-test="constraint-search"]').setValue("s3");
    const rules = wrap.findAll('[data-test="constraint-rule"]');
    expect(rules.length).toBe(1);
    expect(rules[0]?.text()).toContain("Boost ×2");
  });
});

describe("PayloadPreview — wildcard fallback (schema v9)", () => {
  it("tags the fallback option and gives it its normal share", () => {
    const wrap = mount(PayloadPreview, {
      props: {
        payload: row("wildcard", {
          var_binding: "hair",
          options: [
            { id: "a1", value: "red hair", weight: 1 },
            { id: "a2", value: "black hair", weight: 1 },
            { id: "a3", value: "hair", weight: 1, fallback: true },
          ],
        }),
      },
    });
    const fbs = wrap.findAll("[data-test='option-fallback']");
    expect(fbs.length).toBe(1);
    expect(fbs[0]?.text()).toBe("fallback");
    // The fallback rolls like the others, so all three split the draws.
    expect(wrap.text()).toContain("33%");
    expect(wrap.text()).not.toContain("50%");
    wrap.unmount();
  });
});
