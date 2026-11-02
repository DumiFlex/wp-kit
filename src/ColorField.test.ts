import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ColorField from "./ColorField.vue";

function mk(props: Record<string, unknown> = {}) {
  return mount(ColorField, { props: { modelValue: "#ff0000", dataTest: "cf", ...props }, attachTo: document.body });
}
function hexBox(): HTMLInputElement {
  const el = document.querySelector<HTMLInputElement>('[data-test="cf-hex"]');
  if (!el) throw new Error("hex box not open");
  return el;
}
function last(w: ReturnType<typeof mk>): string {
  const all = w.emitted("update:modelValue") ?? [];
  return all[all.length - 1]?.[0] as string;
}
async function openPanel(w: ReturnType<typeof mk>) {
  await w.find('[data-test="cf"]').trigger("click");
}

describe("ColorField", () => {
  it("shows the value and opens on click", async () => {
    const w = mk();
    expect(w.find('[data-test="cf"]').text()).toBe("#ff0000");
    await openPanel(w);
    expect(document.querySelector('[data-test="cf-hex"]')).not.toBeNull();
    w.unmount();
  });

  it("takes a typed hex and keeps the alpha only with alpha on", async () => {
    const w = mk();
    await openPanel(w);
    const hex = hexBox();
    hex.value = "#00ff0080";
    hex.dispatchEvent(new Event("change"));
    expect(last(w)).toBe("#00ff00");
    w.unmount();
    const a = mk({ alpha: true });
    await openPanel(a);
    const hexA = hexBox();
    hexA.value = "#0f08";
    hexA.dispatchEvent(new Event("change"));
    expect(last(a)).toBe("#00ff0088");
    hexA.value = "nope";
    hexA.dispatchEvent(new Event("change"));
    expect(a.emitted("update:modelValue")).toHaveLength(1);
    a.unmount();
  });

  it("offers None with allow-none and marks it on the swatch", async () => {
    const w = mk({ allowNone: true });
    await openPanel(w);
    (document.querySelector('[data-test="cf-none"]') as HTMLElement).click();
    expect(last(w)).toBe("none");
    w.unmount();
    const none = mk({ modelValue: "none" });
    expect(none.find('[data-test="cf"]').classes()).toContain("is-none");
    none.unmount();
  });

  it("keeps a colour name it can't edit", () => {
    const w = mk({ modelValue: "red" });
    expect(w.find('[data-test="cf"]').text()).toBe("red");
    w.unmount();
  });

  it("offers no presets unless asked, and its own list when given one", async () => {
    const plain = mk();
    await openPanel(plain);
    expect(document.querySelector('[data-test="cf-preset"]')).toBeNull();
    plain.unmount();
    const own = mk({ presets: ["#111111", "#222222"] });
    await openPanel(own);
    expect(document.querySelectorAll('[data-test="cf-preset"]')).toHaveLength(2);
    own.unmount();
  });

  it("takes a preset in one click, marks the current one and closes", async () => {
    const w = mk({ presets: true, modelValue: "#7C3AED" });
    await openPanel(w);
    const presets = [...document.querySelectorAll<HTMLButtonElement>('[data-test="cf-preset"]')];
    expect(presets).toHaveLength(12);
    expect(presets[0]?.getAttribute("aria-pressed")).toBe("true");
    expect(presets[1]?.getAttribute("aria-pressed")).toBe("false");
    presets[1]?.click();
    await w.vm.$nextTick();
    expect(last(w)).toBe("#a78bfa");
    expect(document.querySelector('[data-test="cf-hex"]')).toBeNull();
    w.unmount();
  });

  it("shows the swatch alone when compact, with a bigger swatch at md", () => {
    const w = mk({ compact: true, size: "md" });
    const trigger = w.get('[data-test="cf"]');
    expect(trigger.text()).toBe("");
    expect(trigger.classes()).toEqual(expect.arrayContaining(["wp-color-field--compact", "wp-color-field--md"]));
    expect(trigger.attributes("aria-label")).toBe("Colour: #ff0000");
    w.unmount();
  });
});
