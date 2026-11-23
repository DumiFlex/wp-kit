import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import OrbitPad from "../OrbitPad.vue";

const mounted: { unmount: () => void }[] = [];
afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount());
  document.body.innerHTML = "";
});

function bound(props: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper
  const w: any = mount(OrbitPad, {
    props: { ...props, "onUpdate:modelValue": (v: unknown) => w.setProps({ modelValue: v }) } as never,
    attachTo: document.body,
  });
  mounted.push(w);
  return w;
}

function box(el: Element): void {
  (el as HTMLElement).getBoundingClientRect = () => ({ top: 0, bottom: 100, height: 100, left: 0, right: 100, width: 100, x: 0, y: 0, toJSON: () => ({}) });
}

async function point(el: Element, type: string, x: number, y: number): Promise<void> {
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y }));
  await nextTick();
}

const pane = (w: { find: (s: string) => { element: Element } }, p: "top" | "side"): Element => w.find(`[data-pane="${p}"]`).element;

describe("OrbitPad", () => {
  it("drags round the top view: angle and distance", async () => {
    const w = bound({ modelValue: [0, 0, 0.5], aroundStep: 15, ariaLabel: "Camera" });
    box(pane(w, "top"));
    // Right of the middle, on the outer ring: 90 degrees, farthest.
    await point(pane(w, "top"), "pointerdown", 88, 50);
    expect(w.props("modelValue")).toEqual([90, 0, 1]);
    // Up-left near the middle: back-left, nearest.
    await point(pane(w, "top"), "pointermove", 44, 44);
    expect(w.props("modelValue")).toEqual([-135, 0, 0]);
    await point(pane(w, "top"), "pointerup", 44, 44);
    expect(w.emitted("change")?.at(-1)).toEqual([[-135, 0, 0]]);
  });

  it("drags up the side view's arc, clamped to its range", async () => {
    const w = bound({ modelValue: [0, 0, 0.5], heightMin: -30, heightMax: 60, heightStep: 5 });
    box(pane(w, "side"));
    await point(pane(w, "side"), "pointerdown", 26, 10);
    expect(w.props("modelValue")).toEqual([0, 60, 0.5]);
    await point(pane(w, "side"), "pointermove", 60, 62);
    expect(w.props("modelValue")).toEqual([0, 0, 0.5]);
  });

  it("moves by keys: turn, out and in, height", async () => {
    const w = bound({ modelValue: [180, 0, 0.5], aroundStep: 15, distanceStep: 0.1 });
    const [top, side] = w.findAll("[role=slider]");
    await top.trigger("keydown", { key: "ArrowRight" });
    expect(w.props("modelValue")).toEqual([-165, 0, 0.5]);
    await top.trigger("keydown", { key: "ArrowUp" });
    expect(w.props("modelValue")).toEqual([-165, 0, 0.6]);
    await top.trigger("keydown", { key: "Home" });
    expect(w.props("modelValue")[0]).toBe(0);
    await side.trigger("keydown", { key: "End" });
    expect(w.props("modelValue")[1]).toBe(90);
    await side.trigger("keydown", { key: "ArrowDown", shiftKey: true });
    expect(w.props("modelValue")[1]).toBe(80);
    await side.trigger("keydown", { key: "x" });
    expect(w.emitted("change")).toHaveLength(5);
  });

  it("says each part in words and lights the nearest mark", () => {
    const fmt = (v: number, part: string): string => (part === "around" ? (v === -45 ? "front-left" : "?") : part === "height" ? "high angle" : "medium");
    const w = bound({ modelValue: [-45, 30, 0.5], format: fmt, aroundMarks: [{ at: -45, label: "front-left" }, { at: 90, label: "right" }] });
    const [top, side] = w.findAll("[role=slider]");
    expect(top.attributes("aria-valuetext")).toBe("front-left, Distance medium");
    expect(side.attributes("aria-valuetext")).toBe("high angle");
    const on = w.findAll(".wp-orbit__mark[data-on]");
    expect(on.map((m: { text: () => string }) => m.text())).toEqual(["front-left"]);
  });

  it("does nothing while disabled, and the light variant is marked", async () => {
    const w = bound({ modelValue: [0, 0, 0.5], disabled: true, variant: "light" });
    box(pane(w, "top"));
    await point(pane(w, "top"), "pointerdown", 88, 50);
    await w.findAll("[role=slider]")[0].trigger("keydown", { key: "ArrowRight" });
    expect(w.emitted("update:modelValue")).toBeUndefined();
    expect(w.find(".wp-orbit").attributes("data-variant")).toBe("light");
    expect(w.findAll("[role=slider]")[0].attributes("tabindex")).toBe("-1");
  });
});
