import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Chip from "../Chip.vue";

describe("Chip.vue", () => {
  it("emits remove when close button clicked", async () => {
    const wrap = mount(Chip, {
      props: { removable: true },
      slots: { default: "tag" },
    });
    await wrap.get(".wp-chip__close").trigger("click");
    expect(wrap.emitted("remove")).toBeTruthy();
  });

  it("applies tone class", () => {
    const wrap = mount(Chip, { props: { tone: "success" }, slots: { default: "ok" } });
    expect(wrap.get("span.wp-chip").classes()).toContain("wp-chip--success");
  });

  it("is a span by default and a pressable button with as=button", async () => {
    expect(mount(Chip, { slots: { default: "a" } }).element.tagName).toBe("SPAN");
    const b = mount(Chip, { props: { as: "button", removable: true }, slots: { default: "portrait" } });
    expect(b.element.tagName).toBe("BUTTON");
    expect(b.attributes("type")).toBe("button");
    expect(b.classes()).toContain("wp-chip--action");
    // A pressable chip never nests a ✕ button.
    expect(b.find(".wp-chip__close").exists()).toBe(false);
    await b.trigger("click");
    expect(b.emitted("click")).toHaveLength(1);
  });

  it("renders as a link", () => {
    const a = mount(Chip, { props: { as: "a" }, attrs: { href: "/browse?tag=x" }, slots: { default: "x" } });
    expect(a.element.tagName).toBe("A");
    expect(a.attributes("type")).toBeUndefined();
    expect(a.attributes("href")).toBe("/browse?tag=x");
  });
  it("draws a stat tile: the count on top, the label under it, the colour as its edge", async () => {
    const w = mount(Chip, { props: { variant: "stat", count: 24, color: "red", pressed: false }, slots: { default: "Subjects" } });
    const b = w.get("button.wp-chip");
    expect(b.classes()).toContain("wp-chip--stat");
    expect(b.classes()).not.toContain("wp-chip--color");
    expect(b.attributes("aria-pressed")).toBe("false");
    expect(b.attributes("style")).toContain("--wp-chip-c: red");
    expect(w.get(".wp-chip__stat-n").text()).toBe("24");
    expect(w.get(".wp-chip__stat-label").text()).toBe("Subjects");
    expect(w.find(".wp-chip__count").exists()).toBe(false);
    const order = [...b.element.children].map((c) => c.className);
    expect(order).toEqual(["wp-chip__stat-n", "wp-chip__stat-label"]);
  });

  it("a stat tile without pressed is a plain label", () => {
    const w = mount(Chip, { props: { variant: "stat", count: "98%" }, slots: { default: "Carries over" } });
    expect(w.element.tagName).toBe("SPAN");
    expect(w.get(".wp-chip__stat-n").text()).toBe("98%");
  });
});
