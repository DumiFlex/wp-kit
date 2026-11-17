import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import Slider from "../Slider.vue";
import XYPad from "../XYPad.vue";

const mounted: { unmount: () => void }[] = [];
afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount());
  document.body.innerHTML = "";
});

function bound<P extends Record<string, unknown>>(comp: unknown, props: P, slots: Record<string, string> = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper over two components
  const w: any = mount(comp as never, {
    props: { ...props, "onUpdate:modelValue": (v: unknown) => w.setProps({ modelValue: v }) } as never,
    slots,
    attachTo: document.body,
  });
  mounted.push(w);
  return w;
}

/** jsdom has no PointerEvent; a MouseEvent carries the same fields we read. */
async function point(el: Element, type: string, init: MouseEventInit): Promise<void> {
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, ...init }));
  await nextTick();
}

function box(el: Element, w = 100, h = 100): void {
  (el as HTMLElement).getBoundingClientRect = () => ({ top: 0, bottom: h, height: h, left: 0, right: w, width: w, x: 0, y: 0, toJSON: () => ({}) });
}

describe("XYPad", () => {
  it("drags both numbers, with Y growing upward", async () => {
    const w = bound(XYPad, { modelValue: [0, 0], xMin: 0, xMax: 100, xStep: 10, yMin: 0, yMax: 200, yStep: 10, ariaLabel: "Size" });
    box(w.element);
    await point(w.element, "pointerdown", { clientX: 31, clientY: 20 });
    expect(w.props("modelValue")).toEqual([30, 160]);
    await point(w.element, "pointermove", { clientX: 100, clientY: 100 });
    expect(w.props("modelValue")).toEqual([100, 0]);
    await point(w.element, "pointerup", { clientX: 100, clientY: 100 });
    expect(w.emitted("change")?.[0]).toEqual([[100, 0]]);
  });

  it("Shift drags on the fine step", async () => {
    const w = bound(XYPad, { modelValue: [0, 0], xMin: 0, xMax: 1, xStep: 0.1, yStep: 0.1, fineStep: 0.01 });
    box(w.element);
    await point(w.element, "pointerdown", { clientX: 37, clientY: 63 });
    expect(w.props("modelValue")).toEqual([0.4, 0.4]);
    await point(w.element, "pointermove", { clientX: 37, clientY: 63, shiftKey: true });
    expect(w.props("modelValue")).toEqual([0.37, 0.37]);
  });

  it("moves X with Left/Right and Y with Up/Down, and says both", async () => {
    const w = bound(XYPad, { modelValue: [5, 5], xMin: 0, xMax: 10, xStep: 1, yMin: 0, yMax: 10, yStep: 1, xLabel: "Width", yLabel: "Height" });
    const t = w.find("[role=slider]");
    await t.trigger("keydown", { key: "ArrowRight" });
    await t.trigger("keydown", { key: "ArrowUp" });
    expect(w.props("modelValue")).toEqual([6, 6]);
    await t.trigger("keydown", { key: "ArrowDown", shiftKey: true });
    expect(w.props("modelValue")).toEqual([6, 0]);
    await t.trigger("keydown", { key: "End" });
    expect(w.props("modelValue")).toEqual([10, 0]);
    expect(t.attributes("aria-valuetext")).toBe("Width 10, Height 0");
  });

  it("snap-dots lands the point on a dot, and the arrows walk dot to dot", async () => {
    const w = bound(XYPad, { modelValue: [0, 0], xMin: 0, xMax: 100, xStep: 1, yMin: 0, yMax: 100, yStep: 1, xDots: [25, 50, 75], yDots: [50], snapDots: true });
    box(w.element);
    await point(w.element, "pointerdown", { clientX: 31, clientY: 30 });
    expect(w.props("modelValue")).toEqual([25, 50]);
    await point(w.element, "pointerup", { clientX: 31, clientY: 30 });
    const t = w.find("[role=slider]");
    await t.trigger("keydown", { key: "ArrowRight" });
    await t.trigger("keydown", { key: "ArrowUp" });
    expect(w.props("modelValue")).toEqual([50, 100]);
    expect(w.findAll(".wp-xypad__dot")).toHaveLength(3);
  });

  it("stick keeps the point inside its circle; size draws guides and a readout", async () => {
    const w = bound(XYPad, { modelValue: [0, 0], xMin: -1, xMax: 1, xStep: 0.01, yMin: -1, yMax: 1, yStep: 0.01, variant: "stick", grid: 0 });
    box(w.element);
    await point(w.element, "pointerdown", { clientX: 100, clientY: 0 });
    const [x, y] = w.props("modelValue") as [number, number];
    expect(Math.hypot(x, y)).toBeLessThanOrEqual(1.01);
    expect(x).toBeCloseTo(0.71, 1);
    expect(w.find(".wp-xypad__stem").exists()).toBe(true);
    const s = bound(XYPad, { modelValue: [1024, 1024], xMin: 0, xMax: 2048, xStep: 64, yMin: 0, yMax: 2048, yStep: 64, variant: "size", guides: [1, 0.75] });
    expect(s.findAll(".wp-xypad__guide")).toHaveLength(2);
    expect(s.find(".wp-xypad__readout").text()).toBe("1024 × 1024");
    expect(s.find(".wp-xypad__area").exists()).toBe(true);
  });

  it("bands label stretches of an axis and mark the one the point is in", () => {
    const w = bound(XYPad, { modelValue: [0.7, 0.2], xBands: [{ to: 0.5, label: "calm" }, { to: 1, label: "wild" }], yBands: [{ to: 0.5, label: "dark" }, { to: 1, label: "bright" }] });
    const on = w.findAll(".wp-xypad__band[data-on]").map((b: { text: () => string }) => b.text());
    expect(on).toEqual(["wild", "dark"]);
  });

  it("tint colours each section the bands make, the point's one stronger", () => {
    const bands = { xBands: [{ to: 0.5, label: "calm" }, { to: 1, label: "wild" }], yBands: [{ to: 0.5, label: "dim" }, { to: 1, label: "bright" }] };
    const w = bound(XYPad, { modelValue: [0.7, 0.2], tint: true, ...bands });
    const cells = w.findAll(".wp-xypad__cell");
    expect(cells.map((c: { attributes: (k: string) => string }) => c.attributes("data-tone"))).toEqual(["0", "1", "2", "3"]);
    expect(cells.map((c: { attributes: (k: string) => string | undefined }) => c.attributes("data-on") !== undefined)).toEqual([false, false, false, true]);
    const one = bound(XYPad, { modelValue: [0.2, 0.5], tint: true, xBands: bands.xBands });
    expect(one.findAll(".wp-xypad__cell")).toHaveLength(2);
    expect(bound(XYPad, { modelValue: [0.5, 0.5], tint: true }).find(".wp-xypad__cells").exists()).toBe(false);
  });

  it("does nothing while disabled, and shades the area when asked", async () => {
    const w = bound(XYPad, { modelValue: [0.5, 0.25], disabled: true, area: true });
    await w.find("[role=slider]").trigger("keydown", { key: "ArrowRight" });
    expect(w.props("modelValue")).toEqual([0.5, 0.25]);
    const a = w.find(".wp-xypad__area").attributes("style");
    expect(a).toContain("width: 50%");
    expect(a).toContain("height: 25%");
  });
});

describe("Slider variants", () => {
  it("bar puts the label and value inside the track", () => {
    const w = bound(Slider, { modelValue: 0.6, min: 0, max: 1, step: 0.05, variant: "bar", ariaLabel: "Style" }, { label: "Style LoRA" });
    expect(w.find(".wp-slider__track .wp-slider__label").text()).toBe("Style LoRA");
    expect(w.find(".wp-slider__track .wp-slider__value").text()).toBe("0.6");
    expect(w.find(".wp-slider__fill").attributes("style")).toContain("width: 60%");
  });

  it("fader stands up: a drag counts from the bottom", async () => {
    const w = bound(Slider, { modelValue: 0, min: 0, max: 10, variant: "fader", ariaLabel: "CFG" }, { label: "CFG" });
    const t = w.find(".wp-slider__track");
    box(t.element, 28, 100);
    await point(t.element, "pointerdown", { clientY: 30 });
    expect(w.props("modelValue")).toBe(7);
    expect(w.find("[role=slider]").attributes("aria-orientation")).toBe("vertical");
    expect(w.find("[role=slider]").attributes("style")).toContain("bottom: 70%");
    expect(w.find(".wp-slider__label").text()).toBe("CFG");
  });

  it("free drags and types on the fine step; the arrows keep the step", async () => {
    const w = bound(Slider, { modelValue: 0, min: 0, max: 1, step: 0.05, fineStep: 0.01, free: true, ariaLabel: "W" });
    const t = w.find(".wp-slider__track");
    box(t.element);
    await point(t.element, "pointerdown", { clientX: 37 });
    expect(w.props("modelValue")).toBe(0.37);
    await point(t.element, "pointerup", { clientX: 37 });
    await w.find("[role=slider]").trigger("keydown", { key: "ArrowRight" });
    expect(w.props("modelValue")).toBe(0.4);
  });

  it("without free, Shift drags on the fine step", async () => {
    const w = bound(Slider, { modelValue: 0, min: 0, max: 1, step: 0.05, fineStep: 0.01, ariaLabel: "W" });
    const t = w.find(".wp-slider__track");
    box(t.element);
    await point(t.element, "pointerdown", { clientX: 37 });
    expect(w.props("modelValue")).toBe(0.35);
    await point(t.element, "pointermove", { clientX: 37, shiftKey: true });
    expect(w.props("modelValue")).toBe(0.37);
  });
});
