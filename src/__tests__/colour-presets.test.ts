import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { COLOUR_PRESETS, DEFAULT_COLOUR } from "../colour-presets";
import ColorField from "../ColorField.vue";

describe("colour presets", () => {
  it("are twelve hex colours and include the default", () => {
    expect(COLOUR_PRESETS).toHaveLength(12);
    expect(COLOUR_PRESETS.every((c) => /^#[0-9a-f]{6}$/i.test(c))).toBe(true);
    expect(COLOUR_PRESETS).toContain(DEFAULT_COLOUR);
  });

  it("are what ColorField offers with presets on", async () => {
    const w = mount(ColorField, { props: { modelValue: DEFAULT_COLOUR, presets: true, dataTest: "cf" }, attachTo: document.body });
    await w.get('[data-test="cf"]').trigger("click");
    const shown = [...document.querySelectorAll<HTMLElement>('[data-test="cf-preset"]')].map((b) => b.title);
    expect(shown).toEqual([...COLOUR_PRESETS]);
    w.unmount();
  });
});
