import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import WpIconButton from "./WpIconButton.vue";

describe("WpIconButton", () => {
  it("an icon button keeps its icon, box and no aria-expanded", () => {
    const w = mount(WpIconButton, { props: { icon: "pi-trash", label: "Remove" } });
    const b = w.find("button");
    expect(b.find(".pi-trash").exists()).toBe(true);
    expect(b.attributes("data-variant")).toBe("quiet");
    expect(b.attributes("aria-expanded")).toBeUndefined();
    expect(b.attributes("data-caret")).toBeUndefined();
  });

  it("open makes a bare fold caret with aria-expanded, ignoring icon", async () => {
    const w = mount(WpIconButton, { props: { open: false, label: "Hair colour", icon: "pi-trash" } });
    const b = w.find("button");
    expect(b.attributes("aria-expanded")).toBe("false");
    expect(b.attributes("data-variant")).toBe("bare");
    expect(b.attributes("data-caret")).toBe("true");
    expect(b.find(".pi-chevron-right").exists()).toBe(true);
    expect(b.find(".pi-trash").exists()).toBe(false);
    await w.setProps({ open: true });
    expect(b.attributes("aria-expanded")).toBe("true");
    expect(b.find(".pi-chevron-right").exists()).toBe(true);
  });

  it("a caret can still take the boxed look", () => {
    const w = mount(WpIconButton, { props: { open: true, label: "Group", variant: "quiet" } });
    expect(w.find("button").attributes("data-variant")).toBe("quiet");
  });

  it("emits click", async () => {
    const w = mount(WpIconButton, { props: { open: false, label: "x" } });
    await w.find("button").trigger("click");
    expect(w.emitted("click")).toHaveLength(1);
  });
});
