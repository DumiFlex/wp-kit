import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Checkbox from "../Checkbox.vue";
import { SHARED_TOKENS } from "../tokens";

const box = '[role="checkbox"]';

describe("Checkbox.vue", () => {
  it("toggles modelValue when the box is clicked", async () => {
    const wrap = mount(Checkbox, { props: { modelValue: false, label: "Enable" } });
    await wrap.get(box).trigger("click");
    expect(wrap.emitted("update:modelValue")?.[0]).toEqual([true]);
  });

  it("toggles from a click on the label and from Enter", async () => {
    const wrap = mount(Checkbox, { props: { modelValue: true, label: "Enable" } });
    await wrap.get(".wp-checkbox__label").trigger("click");
    await wrap.get(box).trigger("keydown", { key: "Enter" });
    expect(wrap.emitted("update:modelValue")).toEqual([[false], [false]]);
  });

  it("works with v-model", async () => {
    const wrap = mount({
      components: { Checkbox },
      data: () => ({ on: false }),
      template: `<Checkbox v-model="on" aria-label="On" />`,
    });
    await wrap.get(box).trigger("click");
    expect(wrap.vm.on).toBe(true);
    expect(wrap.get(box).attributes("aria-checked")).toBe("true");
    await wrap.get(box).trigger("click");
    expect(wrap.vm.on).toBe(false);
  });

  it("does not toggle when disabled, and says so", async () => {
    const wrap = mount(Checkbox, { props: { modelValue: false, disabled: true, label: "Off" } });
    await wrap.get(box).trigger("click");
    await wrap.get(".wp-checkbox__label").trigger("click");
    expect(wrap.emitted("update:modelValue")).toBeFalsy();
    expect(wrap.get(box).attributes("aria-disabled")).toBe("true");
    expect(wrap.get(".wp-checkbox").classes()).toContain("is-disabled");
  });

  it("reflects error state via aria-invalid on the box", () => {
    const wrap = mount(Checkbox, { props: { modelValue: false, error: true } });
    expect(wrap.get(box).attributes("aria-invalid")).toBe("true");
  });

  it("renders indeterminate state with aria-checked=mixed when unchecked + indeterminate", () => {
    const wrap = mount(Checkbox, { props: { modelValue: false, indeterminate: true } });
    const el = wrap.get(box);
    expect(el.attributes("aria-checked")).toBe("mixed");
    expect(el.attributes("data-indeterminate")).toBe("true");
    expect(wrap.get("path").attributes("d")).toBe("M3 6h6");
  });

  it("ignores indeterminate when modelValue is true (checked wins)", () => {
    const wrap = mount(Checkbox, { props: { modelValue: true, indeterminate: true } });
    const el = wrap.get(box);
    expect(el.attributes("aria-checked")).toBe("true");
    expect(el.attributes("data-indeterminate")).toBe("false");
  });

  // The TUI look hides the drawn tick (`.wp-check svg { display: none }`) and
  // writes [x]; an inline display on the tick beat that rule and drew both.
  it("puts no inline style on the tick or the dash", () => {
    for (const props of [{ modelValue: true, indeterminate: false }, { modelValue: false, indeterminate: true }]) {
      const wrap = mount(Checkbox, { props });
      expect(wrap.get("svg").attributes("style")).toBeUndefined();
    }
  });

  it("draws a field box whose label toggles once", async () => {
    const wrap = mount(Checkbox, { props: { modelValue: false, label: "Favorites only", field: true } });
    expect(wrap.get(".wp-checkbox").classes()).toContain("wp-checkbox--field");
    await wrap.get(".wp-checkbox__label").trigger("click");
    expect(wrap.emitted("update:modelValue")).toEqual([[true]]);
  });

  it("sizes the box sm or md (md by default)", () => {
    expect(mount(Checkbox, { props: { modelValue: false } }).get(box).classes()).not.toContain("wp-check--sm");
    expect(mount(Checkbox, { props: { modelValue: false, size: "sm" } }).get(box).classes()).toContain("wp-check--sm");
    const labelled = mount(Checkbox, { props: { modelValue: false, size: "sm", label: "Row" } });
    expect(labelled.get(".wp-checkbox").classes()).toContain("wp-checkbox--sm");
  });

  it("is the box itself without a label, so attributes land on it", () => {
    const wrap = mount(Checkbox, {
      props: { modelValue: true, ariaLabel: "Enabled" },
      attrs: { class: "my-row__check", title: "On", "data-test": "row-on", style: "--check-on: red" },
    });
    expect(wrap.element.tagName).toBe("BUTTON");
    expect(wrap.attributes("role")).toBe("checkbox");
    expect(wrap.classes()).toEqual(expect.arrayContaining(["wp-check", "my-row__check"]));
    expect(wrap.attributes("data-test")).toBe("row-on");
    expect(wrap.attributes("title")).toBe("On");
    expect(wrap.attributes("aria-label")).toBe("Enabled");
    expect(wrap.attributes("style")).toContain("--check-on");
    expect(wrap.find(".wp-checkbox").exists()).toBe(false);
  });

  it("puts attributes on the wrapper with a label, and names the box by it", () => {
    const wrap = mount(Checkbox, {
      props: { modelValue: false, label: "Include" },
      attrs: { "data-test": "inc" },
    });
    expect(wrap.classes()).toContain("wp-checkbox");
    expect(wrap.attributes("data-test")).toBe("inc");
    expect(wrap.get(box).attributes("aria-label")).toBe("Include");
  });

  it("takes the label from the slot, named by aria-labelledby", async () => {
    const wrap = mount(Checkbox, { props: { modelValue: false }, slots: { default: "Use <b>tags</b>" } });
    const label = wrap.get(".wp-checkbox__label");
    expect(label.html()).toContain("<b>tags</b>");
    expect(wrap.get(box).attributes("aria-labelledby")).toBe(label.attributes("id"));
    await label.trigger("click");
    expect(wrap.emitted("update:modelValue")).toEqual([[true]]);
  });

  // Runs on the canvas, where src/theme/tokens.css is not loaded: its look is
  // its own scoped sheet, reading only the shared token names (the box, the
  // checked fill with its --check-on override, the sm size).
  it("carries its own scoped look on shared tokens only", () => {
    const sfc = readFileSync(resolve(__dirname, "../Checkbox.vue"), "utf8");
    const style = sfc.slice(sfc.indexOf("<style scoped>"));
    expect(style).toContain(".wp-check {");
    expect(style).toContain("var(--check-on, var(--wp-accent-600))");
    expect(style).toContain(".wp-check--sm {");
    const shared = new Set<string>(SHARED_TOKENS);
    const reads = [...style.matchAll(/var\((--wp-[a-z0-9-]+)/g)].map((m) => m[1]);
    expect(reads.filter((n) => !shared.has(n ?? ""))).toEqual([]);
    const theme = readFileSync(resolve(__dirname, "../theme/tokens.css"), "utf8");
    expect(theme).not.toMatch(/^\.wp-check\b/m);
    expect(theme).not.toMatch(/^\.wp-radio\b/m);
  });
});
