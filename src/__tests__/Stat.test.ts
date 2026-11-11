import { afterEach, describe, expect, it } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import Stat from "../Stat.vue";
import Avatar from "../Avatar.vue";

const mounted: VueWrapper[] = [];
afterEach(() => { while (mounted.length) mounted.pop()?.unmount(); });

describe("Stat", () => {
  it("groups a number for the locale and names it", () => {
    const w = mount(Stat, { props: { label: "Downloads", value: 12045, locale: "en-GB", delta: "+3 today", icon: "pi-download" } });
    mounted.push(w);
    expect(w.get("[data-test=stat-value]").text()).toBe("12,045");
    expect(w.text()).toContain("Downloads");
    expect(w.text()).toContain("+3 today");
    expect(w.find(".wp-stat-piece__icon .pi-download").exists()).toBe(true);
    expect(w.classes()).toContain("wp-stat-piece--tile");
  });

  it("shows text as is and a dash for nothing", () => {
    const a = mount(Stat, { props: { label: "Latest", value: "v7" } });
    const b = mount(Stat, { props: { label: "Latest", value: null } });
    mounted.push(a, b);
    expect(a.get("[data-test=stat-value]").text()).toBe("v7");
    expect(b.get("[data-test=stat-value]").text()).toBe("—");
  });

  it("row has no delta line or corner icon; its icon sits by the label", () => {
    const w = mount(Stat, { props: { label: "Stars", value: 3, variant: "row", delta: "x", icon: "pi-star" } });
    mounted.push(w);
    expect(w.find(".wp-stat-piece__delta").exists()).toBe(false);
    expect(w.find(".wp-stat-piece__icon").exists()).toBe(false);
    expect(w.find(".wp-stat-piece__row-icon.pi-star").exists()).toBe(true);
  });

  it("as a button it is a real button; loading shows a skeleton", () => {
    const w = mount(Stat, { props: { label: "Open", value: 2, as: "button", loading: true } });
    mounted.push(w);
    expect(w.element.tagName).toBe("BUTTON");
    expect(w.attributes("type")).toBe("button");
    expect(w.find("[data-test=stat-value]").text()).not.toContain("2");
  });

  it("Avatar takes the profile sizes", () => {
    const w = mount(Avatar, { props: { name: "Ada", size: "2xl", shape: "square" } });
    mounted.push(w);
    expect(w.attributes("data-size")).toBe("2xl");
  });
});
