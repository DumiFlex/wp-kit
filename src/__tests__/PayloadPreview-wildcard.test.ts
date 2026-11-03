import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import PayloadPreview from "../PayloadPreview.vue";

/**
 * A multi-axis wildcard payload: two axes (hue / temperature) and options
 * each tagged on BOTH axes. The flat-registry renderer would list every
 * option once per matching tag (here: twice); the axis renderer must list
 * each option exactly ONCE under the active axis.
 *
 * The preview's `inner` computed falls back to the top-level object when
 * there's no nested `payload`, so the type-specific fields live at the root.
 */
function wildcardPayload() {
  return {
    type: "wildcard",
    name: "Color",
    var_binding: "color",
    tag_groups: {
      hue: ["red", "blue"],
      temperature: ["warm", "cool"],
    },
    options: [
      { value: "crimson", weight: 1, sub_categories: ["red", "warm"] },
      { value: "scarlet", weight: 1, sub_categories: ["red", "warm"] },
      { value: "azure", weight: 1, sub_categories: ["blue", "cool"] },
      { value: "teal", weight: 1, sub_categories: ["blue", "cool"] },
    ],
  };
}

describe("PayloadPreview — multi-axis wildcard", () => {
  it("offers a Group by button per axis", () => {
    const wrap = mount(PayloadPreview, {
      props: { payload: wildcardPayload() },
    });
    expect(wrap.find('[data-test="groupby-hue"]').exists()).toBe(true);
    expect(wrap.find('[data-test="groupby-temperature"]').exists()).toBe(true);
    wrap.unmount();
  });

  it("lists each option exactly ONCE under the default (first) axis", () => {
    const wrap = mount(PayloadPreview, {
      props: { payload: wildcardPayload() },
    });
    // 4 options total — NOT 8 (which is what re-listing per matching tag
    // would produce, since every option is tagged on both axes).
    const items = wrap.findAll(".wp-wildcard-option");
    expect(items.length).toBe(4);
    wrap.unmount();
  });

  it("still lists each option once after switching the group-by axis", async () => {
    const wrap = mount(PayloadPreview, {
      props: { payload: wildcardPayload() },
    });
    await wrap.find('[data-test="groupby-temperature"]').trigger("click");
    const items = wrap.findAll(".wp-wildcard-option");
    expect(items.length).toBe(4);
    wrap.unmount();
  });
});
