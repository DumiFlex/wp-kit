import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";
import { mount } from "@vue/test-utils";
import { useGrowableField, type GrowableField } from "../useGrowableField";
import { flushLayout } from "../layout-batch";

/**
 * A page of growable fields (the 151-option wildcard editor) used to read
 * then write each field in turn when the webfonts landed: one forced layout
 * per field. These tests stand in for the browser's layout: a write marks
 * layout dirty, and a read while dirty counts one forced layout.
 */

let frames: FrameRequestCallback[] = [];
let layouts = 0;
let dirty = false;
const log: string[] = [];

function runFrame(): void {
  const now = frames;
  frames = [];
  for (const fn of now) fn(0);
}

function read(id: number, what: string): void {
  if (dirty) { layouts++; dirty = false; }
  log.push(`R${id}:${what}`);
}
function write(id: number, what: string): void {
  dirty = true;
  log.push(`W${id}:${what}`);
}

/** Wire one element's geometry and `style.height` to the fake layout. */
function instrument(el: HTMLElement, id: number, content: number, cap = Infinity): void {
  let height = "";
  const box = (): number => {
    const set = Number.parseFloat(height);
    return Math.min(cap, Number.isFinite(set) ? set : content);
  };
  Object.defineProperty(el.style, "height", {
    configurable: true,
    get: () => height,
    set: (v: string) => { height = v; write(id, `height=${v}`); },
  });
  Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => { read(id, "scrollHeight"); return Math.max(content, box()); } });
  Object.defineProperty(el, "clientHeight", { configurable: true, get: () => { read(id, "clientHeight"); return box(); } });
  Object.defineProperty(el, "scrollTop", { configurable: true, get: () => 0 });
  el.getBoundingClientRect = () => {
    read(id, "rect");
    const hgt = box();
    return { height: hgt, bottom: hgt, top: 0, left: 0, right: 100, width: 100, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
  };
}

class FakeResizeObserver {
  static all: FakeResizeObserver[] = [];
  constructor(public cb: () => void) { FakeResizeObserver.all.push(this); }
  observe() {}
  unobserve() {}
  disconnect() {}
}

let resolveFonts: () => void = () => {};

beforeEach(() => {
  frames = [];
  layouts = 0;
  dirty = false;
  log.length = 0;
  FakeResizeObserver.all = [];
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => { frames.push(fn); return frames.length; });
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  const real = window.getComputedStyle.bind(window);
  vi.stubGlobal("getComputedStyle", (el: Element) => {
    const id = Number((el as HTMLElement).dataset.id ?? -1);
    read(id, "style");
    return real(el);
  });
  const ready = new Promise<void>((res) => { resolveFonts = res; });
  Object.defineProperty(document, "fonts", { value: { ready }, configurable: true });
});
afterEach(() => {
  flushLayout();
  vi.unstubAllGlobals();
  Object.defineProperty(document, "fonts", { value: undefined, configurable: true });
});

/** N fields in one component, like the editor's option rows. */
function mountFields(n: number, content = (i: number) => 40 + i, cap = Infinity) {
  const els = Array.from({ length: n }, () => ref<HTMLElement | null>(null));
  const apis: GrowableField[] = [];
  const Comp = defineComponent({
    setup() {
      for (const el of els) apis.push(useGrowableField(() => el.value));
      return () => h("div", els.map((el, i) => h("div", {
        "data-id": String(i),
        ref: (r) => { el.value = r as HTMLElement | null; },
      })));
    },
  });
  const wrap = mount(Comp, { attachTo: document.body });
  els.forEach((el, i) => { if (el.value) instrument(el.value, i, content(i), cap); });
  for (const api of apis) api.attach();
  return { wrap, apis, els };
}

async function fontsLand(): Promise<void> {
  resolveFonts();
  await Promise.resolve();
  await Promise.resolve();
}

describe("useGrowableField — one layout pass for a page of fields", () => {
  it("measures every field before writing any once the fonts land", async () => {
    const N = 30;
    const { wrap, els } = mountFields(N);
    runFrame(); // starting heights
    layouts = 0;
    log.length = 0;

    await fontsLand();
    expect(log).toEqual([]); // nothing touched inside the promise callbacks
    runFrame();

    // Round one: every `height: auto`, then every read, then every height.
    const firstRead = log.findIndex((e) => e.startsWith("R"));
    const firstSet = log.findIndex((e) => /^W\d+:height=\d/.test(e));
    expect(log.slice(0, firstRead).every((e) => e.endsWith("height=auto"))).toBe(true);
    expect(log.slice(firstRead, firstSet).every((e) => e.startsWith("R"))).toBe(true);
    expect(log.filter((e) => e.endsWith("height=auto"))).toHaveLength(N);
    // The old per-field read/write paid a layout per field; this pays two
    // (the fit, then the hint against the fitted height) whatever N is.
    expect(layouts).toBeLessThanOrEqual(2);
    els.forEach((el, i) => expect(el.value?.style.height).toBe(`${40 + i}px`));
    wrap.unmount();
  });

  it("sets the hint from the fitted height (a capped box shows more below)", async () => {
    const { wrap, apis } = mountFields(3, (i) => (i === 1 ? 500 : 50), 200);
    runFrame();
    await fontsLand();
    runFrame();
    expect(apis.map((a) => a.hasMoreBelow.value)).toEqual([false, true, false]);
    wrap.unmount();
  });

  it("measures a scheduled hint once, however often it is asked for in a frame", () => {
    const { wrap, apis } = mountFields(5);
    runFrame();
    log.length = 0;
    for (let k = 0; k < 4; k++) apis[2]?.scheduleOverflowHint();
    runFrame();
    expect(log.filter((e) => e.endsWith(":scrollHeight"))).toEqual(["R2:scrollHeight"]);
    wrap.unmount();
  });

  it("typing in one field measures that field only", () => {
    const { wrap, apis } = mountFields(10);
    runFrame();
    log.length = 0;
    apis[4]?.autosize();
    apis[4]?.updateOverflowHint();
    apis[4]?.scheduleOverflowHint();
    runFrame();
    expect(log.length).toBeGreaterThan(0);
    expect(log.every((e) => /^[RW]4:/.test(e))).toBe(true);
    wrap.unmount();
  });

  it("batches the resize observers' work too, without flagging its own fit as a drag", async () => {
    const N = 12;
    const { wrap, apis } = mountFields(N, () => 120, 80);
    runFrame();
    await fontsLand();
    runFrame();
    layouts = 0;
    // Every field's observer reports in the same frame.
    for (const ro of FakeResizeObserver.all) ro.cb();
    runFrame();
    expect(layouts).toBeLessThanOrEqual(1);
    expect(apis.every((a) => !a.userResized.value)).toBe(true);
    wrap.unmount();
  });

  it("skips a field that unmounted before its pass", async () => {
    const { wrap, apis } = mountFields(2);
    runFrame();
    apis[0]?.scheduleOverflowHint();
    wrap.unmount();
    log.length = 0;
    runFrame();
    expect(log).toEqual([]);
  });
});
