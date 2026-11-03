import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import PreviewGroup from "../PreviewGroup.vue";

describe("PreviewGroup", () => {
  it("draws a named group as a folding heading with its count and note", async () => {
    const w = mount(PreviewGroup, {
      props: { name: "calm", open: true, count: 3, aside: "40%", testId: "group-calm" },
      slots: { default: "<p class='body'>rows</p>" },
    });
    const head = w.find('[data-test="group-calm"]');
    expect(head.attributes("aria-expanded")).toBe("true");
    expect(head.text()).toContain("calm");
    expect(w.find(".wp-pv-group__count").text()).toBe("3");
    expect(w.find(".wp-pv-group__aside").text()).toBe("40%");
    expect(w.find(".body").exists()).toBe(true);
    await head.trigger("click");
    expect(w.emitted("update:open")?.[0]).toEqual([false]);
  });

  it("builds a closed group's body only when it opens", async () => {
    const w = mount(PreviewGroup, { props: { name: "intense", open: false }, slots: { default: "<p class='body'>rows</p>" } });
    expect(w.find(".body").exists()).toBe(false);
    await w.setProps({ open: true });
    expect(w.find(".body").exists()).toBe(true);
  });

  it("has no heading and is always open without a name", () => {
    const w = mount(PreviewGroup, { props: { open: false }, slots: { default: "<p class='body'>rows</p>" } });
    expect(w.find("button").exists()).toBe(false);
    expect(w.find(".body").exists()).toBe(true);
  });
});
