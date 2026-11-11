import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import IconPicker from "../IconPicker.vue";
import { PI_ICONS } from "../pi-icons";
import { ICON_GROUPS } from "../icon-catalog";

describe("IconPicker", () => {
  it("inline shows the curated groups, and picks or clears", async () => {
    const w = mount(IconPicker, { props: { modelValue: "user", inline: true } });
    const curated = ICON_GROUPS.flatMap((g) => g.icons).length;
    expect(w.findAll(".wp-iconpick__cell")).toHaveLength(curated);
    expect(w.find('[data-test="icon-picker-user"]').attributes("aria-selected")).toBe("true");
    await w.find('[data-test="icon-picker-heart"]').trigger("click");
    await w.find('[data-test="icon-picker-none"]').trigger("click");
    expect(w.emitted("update:modelValue")).toEqual([["heart"], [null]]);
  });

  it("all offers every glyph and finds them by words", async () => {
    const w = mount(IconPicker, { props: { modelValue: null, inline: true, all: true, allowNone: false } });
    expect(w.findAll(".wp-iconpick__cell")).toHaveLength(PI_ICONS.length);
    expect(w.find('[data-test="icon-picker-none"]').exists()).toBe(false);
    await w.find("input").setValue("arrow right");
    const shown = w.findAll(".wp-iconpick__cell").map((c) => c.attributes("data-test"));
    expect(shown).toContain("icon-picker-arrow-right");
    expect(shown.every((t) => t?.includes("arrow-right"))).toBe(true);
    await w.find("input").setValue("zzzz");
    expect(w.find(".wp-iconpick__empty").text()).toContain("zzzz");
  });

  it("size sm is the small field; compact sm is a square with no caret", () => {
    const sm = mount(IconPicker, { props: { modelValue: "sun", size: "sm" } });
    expect(sm.find(".wp-iconpick__trigger").classes()).toContain("wp-iconpick__trigger--sm");
    expect(sm.find(".wp-iconpick__name").text()).toBe("Sun");
    expect(sm.find(".wp-iconpick__caret").exists()).toBe(true);
    const square = mount(IconPicker, { props: { modelValue: null, size: "sm", compact: true } });
    expect(square.find(".wp-iconpick__name").exists()).toBe(false);
    expect(square.find(".wp-iconpick__caret").exists()).toBe(false);
    expect(square.find(".wp-iconpick__none").exists()).toBe(true);
    const md = mount(IconPicker, { props: { modelValue: "sun", compact: true } });
    expect(md.find(".wp-iconpick__trigger").classes()).toContain("wp-iconpick__trigger--md");
    expect(md.find(".wp-iconpick__caret").exists()).toBe(true);
  });

  it("tints the glyphs with color, and is one element for a parent's class", () => {
    const w = mount(IconPicker, { props: { modelValue: null, inline: true, all: true, color: "red" }, attrs: { class: "mine" } });
    expect(w.element.classList.contains("mine")).toBe(true);
    expect(w.find(".wp-iconpick__cell i").attributes("style")).toContain("color: red");
  });
});
