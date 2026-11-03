import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SelectionBar from "../SelectionBar.vue";

describe("SelectionBar", () => {
  it("says how many are selected, with the noun, and holds the actions", () => {
    const w = mount(SelectionBar, { props: { count: 3, noun: "options" }, slots: { default: '<button class="act">Delete</button>', start: '<span class="opt">DM</span>' } });
    expect(w.attributes("role")).toBe("toolbar");
    expect(w.find('[data-test="selection-count"]').text()).toBe("3 options selected");
    expect(w.find(".act").exists()).toBe(true);
    expect(w.find(".opt").exists()).toBe(true);
  });

  it("says one row in the singular", async () => {
    const w = mount(SelectionBar, { props: { count: 1, noun: "reports" } });
    expect(w.find('[data-test="selection-count"]').text()).toBe("1 report selected");
    await w.setProps({ noun: "boxes", nounOne: "box" });
    expect(w.find('[data-test="selection-count"]').text()).toBe("1 box selected");
    await w.setProps({ count: 2 });
    expect(w.find('[data-test="selection-count"]').text()).toBe("2 boxes selected");
  });

  it("clears from the button and from Escape inside it", async () => {
    const w = mount(SelectionBar, { props: { count: 1 } });
    await w.find('[data-test="selection-clear"]').trigger("click");
    await w.trigger("keydown", { key: "Escape" });
    expect(w.emitted("clear")).toHaveLength(2);
  });

  it("hide-clear drops Clear and leaves Escape alone; sticky marks it", async () => {
    const w = mount(SelectionBar, { props: { count: 1, hideClear: true, sticky: true } });
    expect(w.find('[data-test="selection-clear"]').exists()).toBe(false);
    await w.trigger("keydown", { key: "Escape" });
    expect(w.emitted("clear")).toBeUndefined();
    expect(w.attributes("data-sticky")).toBe("true");
  });

  it("is one element, so a parent's class and data-test land on it", () => {
    const w = mount(SelectionBar, { props: { count: 2 }, attrs: { class: "my-bar" } });
    expect(w.element.classList.contains("my-bar")).toBe(true);
    expect(w.element.classList.contains("wp-selbar")).toBe(true);
  });
});
