import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import TrianglePad from "../TrianglePad.vue";
import { CORNERS, pointOf } from "../triangle";

const mounted: { unmount: () => void }[] = [];
afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount());
  document.body.innerHTML = "";
});

function bound(props: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper
  const w: any = mount(TrianglePad, {
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

async function key(w: { find: (s: string) => { trigger: (e: string, o: object) => Promise<void> } }, k: string, shift = false): Promise<void> {
  await w.find("[role=slider]").trigger("keydown", { key: k, shiftKey: shift });
}

describe("TrianglePad", () => {
  it("drags the mix: a corner takes it all, a point between shares it", async () => {
    const changes: unknown[] = [];
    const w = bound({ modelValue: [34, 33, 33], labels: ["Ink", "Oil", "Pencil"], onChange: (v: unknown) => changes.push(v) });
    const el = w.find(".wp-tri__box").element;
    box(el);
    await point(el, "pointerdown", CORNERS[2][0], CORNERS[2][1]);
    expect(w.props("modelValue")).toEqual([0, 0, 100]);
    const p = pointOf([60, 30, 10]);
    await point(el, "pointermove", p[0], p[1]);
    expect(w.props("modelValue")).toEqual([60, 30, 10]);
    await point(el, "pointerup", p[0], p[1]);
    expect(changes).toEqual([[60, 30, 10]]);
  });

  it("reads the shares and says them at the corners", () => {
    const w = bound({ modelValue: [50, 30, 20], labels: ["Ink", "Oil", "Pencil"], ariaLabel: "Style mix" });
    const thumb = w.find("[role=slider]");
    expect(thumb.attributes("aria-valuetext")).toBe("Ink 50%, Oil 30%, Pencil 20%");
    expect(w.findAll(".wp-tri__label").map((l: { text: () => string }) => l.text())).toEqual(["Ink 50%", "Oil 30%", "Pencil 20%"]);
    expect(w.find('.wp-tri__label[data-corner="0"]').attributes("data-top")).toBeDefined();
  });

  it("moves with the keys, jumps to corners and to the middle", async () => {
    const w = bound({ modelValue: [34, 33, 33] });
    await key(w, "ArrowUp");
    const up = w.props("modelValue") as number[];
    expect(up[0]).toBeGreaterThan(34);
    expect(up.reduce((a, b) => a + b, 0)).toBe(100);
    await key(w, "ArrowRight");
    const right = w.props("modelValue") as number[];
    expect(right[2]).toBeGreaterThan(up[2] ?? 0);
    await key(w, "2");
    expect(w.props("modelValue")).toEqual([0, 100, 0]);
    await key(w, "ArrowLeft");
    expect(w.props("modelValue")).toEqual([0, 100, 0]);
    await key(w, "Home");
    expect(w.props("modelValue")).toEqual([35, 35, 30]);
  });

  it("does nothing while disabled", async () => {
    const w = bound({ modelValue: [100, 0, 0], disabled: true });
    await key(w, "3");
    expect(w.props("modelValue")).toEqual([100, 0, 0]);
    expect(w.find("[role=slider]").attributes("tabindex")).toBe("-1");
  });

  it("uses a format and a custom total", () => {
    const w = bound({ modelValue: [0.5, 0.25, 0.25], total: 1, step: 0.05, format: (v: number) => v.toFixed(2) });
    expect(w.find("[role=slider]").attributes("aria-valuetext")).toBe("A 0.50, B 0.25, C 0.25");
  });
});
