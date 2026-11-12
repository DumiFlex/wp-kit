import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PayloadPreview from "../PayloadPreview.vue";
import WildcardPreview from "../WildcardPreview.vue";
import FixedValuesPreview from "../FixedValuesPreview.vue";
import CombinePreview from "../CombinePreview.vue";
import DerivationPreview from "../DerivationPreview.vue";
import ConstraintPreview from "../ConstraintPreview.vue";
import BundlePreview from "../BundlePreview.vue";
import PostGridSkeleton from "../PostGridSkeleton.vue";
import PostDetailSkeleton from "../PostDetailSkeleton.vue";
import ProfileSkeleton from "../ProfileSkeleton.vue";
import { kindIcon, kindIconClass, moduleSubtype } from "../kind-colour";
import { MODE_GLYPH, MODE_LABEL, normalizeMode } from "../matrix-axis";

const refMap: ReadonlyMap<string, string> = new Map([["aaaa1111", "Palette"]]);
const row = (type: string, payload: Record<string, unknown>): Record<string, unknown> => ({ id: `${type.slice(0, 4)}0000`, type, payload });

const FIXTURES = {
  wildcard: row("wildcard", { var_binding: "colour", options: [{ value: "red", weight: 2 }, { value: "blue" }] }),
  fixed_values: row("fixed_values", { values: [{ id: "v1", name: "style", value: "film grain" }] }),
  combine: row("combine", { output_var: "scene", template: "$colour sky", input_vars: ["colour"] }),
  derivation: row("derivation", {
    rules: [{ branches: [{ condition: { var: "colour", op: "equals", value: "red" }, action: { target_var: "mood", mode: "replace", value: "warm" } }] }],
  }),
  constraint: row("constraint", {
    source_wildcard_id: "aaaa1111", target_wildcard_id: "bbbb2222",
    matrix: { red: { calm: { mode: "exclude", factor: 0 } } }, exceptions: [],
  }),
};

describe("each preview kind renders from a small payload", () => {
  it("wildcard", () => {
    const w = mount(WildcardPreview, { props: { inner: FIXTURES.wildcard.payload as Record<string, unknown>, refMap } });
    expect(w.findAll(".wp-wildcard-option")).toHaveLength(2);
    expect(w.text()).toContain("67%");
  });
  it("fixed values", () => {
    const w = mount(FixedValuesPreview, { props: { inner: FIXTURES.fixed_values.payload as Record<string, unknown>, refMap } });
    expect(w.find('[data-test="fixed-row"]').text()).toContain("$style");
  });
  it("combine", () => {
    const w = mount(CombinePreview, { props: { inner: FIXTURES.combine.payload as Record<string, unknown>, refMap } });
    expect(w.find('[data-test="combine-input"]').text()).toContain("template");
  });
  it("derivation", () => {
    const w = mount(DerivationPreview, {
      props: { payload: FIXTURES.derivation, inner: FIXTURES.derivation.payload as Record<string, unknown>, refMap },
    });
    expect(w.find('[data-test="derivation-test"]').text()).toContain("colour");
    expect(w.find('[data-test="derivation-action"]').text()).toContain("SET");
  });
  it("constraint, naming the source from refNames", () => {
    const w = mount(ConstraintPreview, {
      props: { inner: FIXTURES.constraint.payload as Record<string, unknown>, refMap, refNames: { aaaa1111: "Palette" }, refGroups: {} },
    });
    expect(w.find(".wp-cn-axis--src").text()).toContain("Palette");
    expect(w.find('.wp-cn-cell[data-mode="exclude"]').exists()).toBe(true);
  });
  it("bundle, with a kind icon on each child", () => {
    const w = mount(BundlePreview, {
      props: { payload: { children: [FIXTURES.wildcard, FIXTURES.combine] }, refNames: {}, refGroups: {} },
    });
    expect(w.findAll('[data-test="bundle-child"]')).toHaveLength(2);
    expect(w.find('[data-test="bundle-child"] .pi-sparkles').exists()).toBe(true);
    expect(w.text()).toContain("It sets");
  });
});

describe("PayloadPreview", () => {
  it("switches to the raw JSON in a code block", async () => {
    const w = mount(PayloadPreview, { props: { payload: FIXTURES.combine } });
    await w.find('[role="tab"]:not([aria-selected="true"])').trigger("click");
    expect(w.find(".wp-payload-raw").text()).toContain('"output_var": "scene"');
  });
  it("hides the tabs when nested or asked to", () => {
    expect(mount(PayloadPreview, { props: { payload: FIXTURES.combine, nested: true } }).find('[role="tab"]').exists()).toBe(false);
    expect(mount(PayloadPreview, { props: { payload: FIXTURES.combine, tabs: false } }).find('[role="tab"]').exists()).toBe(false);
  });
  it("says so for no payload or an unknown kind", () => {
    expect(mount(PayloadPreview, { props: { payload: null } }).text()).toContain("No payload to preview");
    expect(mount(PayloadPreview, { props: { payload: { type: "loop" } } }).text()).toContain("Nothing to render in loop");
  });
});

describe("kind and mode helpers", () => {
  it("names an icon per type, circle for an unknown one", () => {
    expect(kindIcon("wildcard")).toBe("sparkles");
    expect(kindIcon("bundle")).toBe("box");
    expect(kindIcon("loop")).toBe("replay");
    expect(kindIcon("nonsense")).toBe("circle");
    expect(kindIconClass("toggle")).toBe("pi pi-check-square");
    expect(moduleSubtype("combine")).toBe("combine");
    expect(moduleSubtype("bundle")).toBeNull();
  });
  it("reads an unknown mode as neutral", () => {
    expect(normalizeMode("only")).toBe("only");
    expect(normalizeMode("weird")).toBe("allow");
    expect(`${MODE_GLYPH.exclude} ${MODE_LABEL.exclude}`).toBe("× Exclude");
  });
});

describe("post loading shapes", () => {
  it("draws the grid's cards and says loading once", () => {
    const w = mount(PostGridSkeleton, { props: { count: 4 } });
    expect(w.findAll(".wp-post-grid-skeleton__card")).toHaveLength(4);
    expect(w.findAll('[role="status"]')).toHaveLength(1);
    expect(mount(PostGridSkeleton, { props: { label: "" } }).find('[role="status"]').exists()).toBe(false);
  });
  it("draws the post page with its rail", () => {
    const w = mount(PostDetailSkeleton);
    expect(w.find(".wp-post-detail-skeleton__aside").exists()).toBe(true);
    expect(w.find('[role="status"]').text()).toContain("Loading post");
  });
  it("draws a profile, the stat cards only when asked", () => {
    const w = mount(ProfileSkeleton);
    expect(w.find(".wp-profile-skeleton__stats").exists()).toBe(false);
    expect(w.findAll('[role="status"]')).toHaveLength(1);
    expect(mount(ProfileSkeleton, { props: { stats: true } }).findAll(".wp-profile-skeleton__stats .wp-skeleton")).toHaveLength(3);
  });
});
