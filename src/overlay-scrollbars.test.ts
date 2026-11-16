import { afterEach, describe, expect, it, vi } from "vitest";
import { flushLayout } from "./layout-batch";
import { BAR_ROOM_PX, hasOverlayScrollbars, markOverlayScrollbars, scrollingAxes, watchBarRoom } from "./overlay-scrollbars";

const proto = HTMLElement.prototype;
const saved = {
  offsetWidth: Object.getOwnPropertyDescriptor(proto, "offsetWidth"),
  clientWidth: Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth"),
};

function fakeBar(width: number): void {
  Object.defineProperty(proto, "offsetWidth", { configurable: true, get: () => 100 });
  Object.defineProperty(proto, "clientWidth", { configurable: true, get: () => 100 - width });
}

afterEach(() => {
  flushLayout();
  if (saved.offsetWidth) Object.defineProperty(proto, "offsetWidth", saved.offsetWidth);
  delete (proto as unknown as Record<string, unknown>).clientWidth;
  if (saved.clientWidth) Object.defineProperty(Element.prototype, "clientWidth", saved.clientWidth);
  document.documentElement.style.removeProperty("--wp-bar-room");
});

describe("overlay scrollbars", () => {
  it("sets the bar room when the bar takes no width", () => {
    fakeBar(0);
    expect(hasOverlayScrollbars()).toBe(true);
    expect(markOverlayScrollbars()).toBe(true);
    expect(document.documentElement.style.getPropertyValue("--wp-bar-room")).toBe(`${BAR_ROOM_PX}px`);
  });

  it("leaves classic scrollbars alone and clears an old mark", () => {
    document.documentElement.style.setProperty("--wp-bar-room", "12px");
    fakeBar(15);
    expect(markOverlayScrollbars()).toBe(false);
    expect(document.documentElement.style.getPropertyValue("--wp-bar-room")).toBe("");
  });

  it("removes its probe", () => {
    fakeBar(0);
    const before = document.body.childElementCount;
    hasOverlayScrollbars();
    expect(document.body.childElementCount).toBe(before);
  });
});

function sized(el: HTMLElement, box: { sw: number; cw: number; sh: number; ch: number }): void {
  Object.defineProperty(el, "scrollWidth", { configurable: true, get: () => box.sw });
  Object.defineProperty(el, "clientWidth", { configurable: true, get: () => box.cw });
  Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => box.sh });
  Object.defineProperty(el, "clientHeight", { configurable: true, get: () => box.ch });
}

describe("bar room only where a bar is drawn", () => {
  it("names the axes that scroll", () => {
    const el = document.createElement("div");
    sized(el, { sw: 100, cw: 100, sh: 100, ch: 100 });
    expect(scrollingAxes(el)).toBe("");
    sized(el, { sw: 300, cw: 100, sh: 400, ch: 100 });
    expect(scrollingAxes(el)).toBe("x y");
  });

  it("marks a box only while it scrolls", () => {
    const el = document.createElement("textarea");
    const box = { sw: 100, cw: 100, sh: 50, ch: 100 };
    sized(el, box);
    document.body.appendChild(el);
    const stop = watchBarRoom(el);
    flushLayout();
    expect(el.hasAttribute("data-wp-bar")).toBe(false);
    box.sh = 300;
    el.dispatchEvent(new Event("input"));
    flushLayout();
    expect(el.getAttribute("data-wp-bar")).toBe("y");
    box.sh = 50;
    el.dispatchEvent(new Event("input"));
    flushLayout();
    expect(el.hasAttribute("data-wp-bar")).toBe(false);
    stop();
    box.sh = 300;
    el.dispatchEvent(new Event("input"));
    flushLayout();
    expect(el.hasAttribute("data-wp-bar")).toBe(false);
    el.remove();
  });
});

describe("bar room is measured once per frame, all boxes together", () => {
  function counted(el: HTMLElement, box: { sw: number; cw: number; sh: number; ch: number }, log: string[], id: string): void {
    const get = (k: keyof typeof box) => () => { log.push(`R${id}`); return box[k]; };
    Object.defineProperty(el, "scrollWidth", { configurable: true, get: get("sw") });
    Object.defineProperty(el, "clientWidth", { configurable: true, get: get("cw") });
    Object.defineProperty(el, "scrollHeight", { configurable: true, get: get("sh") });
    Object.defineProperty(el, "clientHeight", { configurable: true, get: get("ch") });
  }

  it("coalesces a burst of changes into one measurement on the next frame", async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => { frames.push(fn); return frames.length; });
    const log: string[] = [];
    const el = document.createElement("div");
    counted(el, { sw: 100, cw: 100, sh: 300, ch: 100 }, log, "a");
    document.body.appendChild(el);
    const stop = watchBarRoom(el);
    // A list re-rendering as a search is typed: rows come and go, text changes.
    for (let i = 0; i < 20; i++) {
      el.appendChild(document.createElement("p")).textContent = `row ${i}`;
      el.dispatchEvent(new Event("input"));
    }
    await Promise.resolve(); // mutation records are delivered as a microtask
    expect(log).toEqual([]); // nothing read inside the callbacks
    for (const fn of frames.splice(0)) fn(0);
    expect(log.length).toBeGreaterThan(0);
    expect(log.length).toBeLessThanOrEqual(4); // one scrollingAxes call
    expect(el.getAttribute("data-wp-bar")).toBe("y");
    stop();
    el.remove();
    vi.unstubAllGlobals();
  });

  it("reads every box before marking any", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => { frames.push(fn); return frames.length; });
    const log: string[] = [];
    const els = ["a", "b", "c"].map((id) => {
      const el = document.createElement("div");
      counted(el, { sw: 100, cw: 100, sh: 300, ch: 100 }, log, id);
      const set = el.setAttribute.bind(el);
      el.setAttribute = (n: string, v: string) => { log.push(`W${id}`); set(n, v); };
      document.body.appendChild(el);
      return el;
    });
    const stops = els.map((el) => watchBarRoom(el));
    for (const fn of frames.splice(0)) fn(0);
    const firstWrite = log.findIndex((e) => e.startsWith("W"));
    expect(log.slice(firstWrite).every((e) => e.startsWith("W"))).toBe(true);
    expect(log.filter((e) => e.startsWith("W"))).toEqual(["Wa", "Wb", "Wc"]);
    stops.forEach((s) => s());
    els.forEach((el) => el.remove());
    vi.unstubAllGlobals();
  });

  it("watches new children for size without re-observing the old ones", async () => {
    const observed: Element[] = [];
    let disconnects = 0;
    vi.stubGlobal("ResizeObserver", class {
      observe(el: Element) { observed.push(el); }
      unobserve() {}
      disconnect() { disconnects++; }
    });
    const el = document.createElement("div");
    const first = el.appendChild(document.createElement("p"));
    document.body.appendChild(el);
    const stop = watchBarRoom(el);
    expect(observed).toEqual([el, first]);
    const second = el.appendChild(document.createElement("p"));
    await Promise.resolve();
    expect(observed).toEqual([el, first, second]);
    expect(disconnects).toBe(0);
    stop();
    el.remove();
    vi.unstubAllGlobals();
  });
});
