import { afterEach, describe, expect, it, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import ContextMenu, { type ContextMenuEntry } from "../ContextMenu.vue";
import RadioGroup from "../RadioGroup.vue";

let w: VueWrapper | null = null;
afterEach(() => {
  w?.unmount();
  w = null;
  document.body.innerHTML = "";
});

describe("ContextMenu checkable items", () => {
  it("marks checkable items and keeps the menu open when asked", async () => {
    const tick = vi.fn();
    const act = vi.fn();
    const items: ContextMenuEntry[] = [
      { label: "portrait", checked: true, keepOpen: true, onSelect: tick },
      { label: "noir", checked: false, keepOpen: true, onSelect: tick },
      { label: "Rename", onSelect: act },
    ];
    w = mount(ContextMenu, { props: { visible: true, x: 0, y: 0, items }, attachTo: document.body });
    await w.vm.$nextTick();
    const rows = [...document.body.querySelectorAll<HTMLElement>(".wp-ctxmenu__item")];
    expect(rows.map((r) => r.getAttribute("role"))).toEqual(["menuitemcheckbox", "menuitemcheckbox", "menuitem"]);
    expect(rows.map((r) => r.getAttribute("aria-checked"))).toEqual(["true", "false", null]);
    expect(rows[0]!.querySelector(".wp-ctxmenu__check")?.hasAttribute("data-on")).toBe(true);
    expect(rows[1]!.querySelector(".wp-ctxmenu__check")?.hasAttribute("data-on")).toBe(false);
    rows[1]!.click();
    expect(tick).toHaveBeenCalledTimes(1);
    expect(w.emitted("close")).toBeUndefined();
    rows[2]!.click();
    expect(act).toHaveBeenCalledTimes(1);
    expect(w.emitted("close")).toHaveLength(1);
  });
});

describe("RadioGroup swatches", () => {
  it("draws colour swatches named by their label and picks one", async () => {
    w = mount(RadioGroup, {
      props: {
        modelValue: "violet",
        variant: "swatch",
        ariaLabel: "Accent",
        options: [
          { value: "violet", label: "Violet", color: "#7c3aed" },
          { value: "teal", label: "Teal", color: "#22d3ee" },
        ],
      },
    });
    const opts = w.findAll("[role=radio]");
    expect(opts.map((o) => o.attributes("aria-label"))).toEqual(["Violet", "Teal"]);
    expect(w.find(".wp-radio-group__swatch").attributes("style")).toContain("background");
    expect(w.find(".wp-radio-group__dot").exists()).toBe(false);
    await opts[1]!.trigger("click");
    expect(w.emitted("update:modelValue")?.[0]).toEqual(["teal"]);
  });
});
