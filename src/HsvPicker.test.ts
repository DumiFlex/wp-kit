import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import HsvPicker from "./HsvPicker.vue";

/** jsdom has no layout: give the square a 200 x 100 box with a 1 px border. */
function sized(el: HTMLElement, w: number, h: number): void {
  el.getBoundingClientRect = () => ({ left: 0, top: 0, right: w, bottom: h, width: w, height: h, x: 0, y: 0, toJSON: () => ({}) });
  Object.defineProperty(el, "clientLeft", { value: 1 });
  Object.defineProperty(el, "clientTop", { value: 1 });
  Object.defineProperty(el, "clientWidth", { value: w - 2 });
  Object.defineProperty(el, "clientHeight", { value: h - 2 });
}
function down(el: Element, clientX: number, clientY: number): void {
  el.dispatchEvent(new MouseEvent("pointerdown", { clientX, clientY, bubbles: true, cancelable: true }));
}
function thumb(w: ReturnType<typeof mount>): { left: number; top: number } {
  const s = (w.find(".wp-hsv-picker__sv-cursor").element as HTMLElement).style;
  return { left: parseFloat(s.left), top: parseFloat(s.top) };
}

describe("HsvPicker", () => {
  it("keeps the thumb under the pointer near black, after its own value comes back", async () => {
    const w = mount(HsvPicker, { props: { modelValue: "#6366f1" }, attachTo: document.body });
    const sv = w.find('[data-test="hsv-sv"]').element as HTMLElement;
    sized(sv, 200, 100);
    // 30 % across, 2 % above the bottom of the padding box.
    down(sv, 1 + 0.3 * 198, 1 + 0.98 * 98);
    const hex = (w.emitted("update:modelValue") ?? []).at(-1)?.[0] as string;
    await w.setProps({ modelValue: hex });
    await nextTick();
    const t = thumb(w);
    expect(t.left).toBeCloseTo(30, 5);
    expect(t.top).toBeCloseTo(98, 5);
    document.dispatchEvent(new MouseEvent("pointerup"));
    w.unmount();
  });

  it("still follows a value set from outside", async () => {
    const w = mount(HsvPicker, { props: { modelValue: "#ff0000" } });
    await w.setProps({ modelValue: "#000000" });
    expect(thumb(w).top).toBe(100);
    w.unmount();
  });

  it("measures the pointer inside the border", async () => {
    const w = mount(HsvPicker, { props: { modelValue: "#ff0000" }, attachTo: document.body });
    const sv = w.find('[data-test="hsv-sv"]').element as HTMLElement;
    sized(sv, 200, 100);
    down(sv, 1, 1 + 49); // the inner edge of the left border, half way down
    await nextTick();
    expect(thumb(w).left).toBe(0);
    expect(thumb(w).top).toBe(50);
    document.dispatchEvent(new MouseEvent("pointerup"));
    w.unmount();
  });
});
