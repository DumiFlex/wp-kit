import { afterEach, describe, expect, it } from "vitest";
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
    expect(el.hasAttribute("data-wp-bar")).toBe(false);
    box.sh = 300;
    el.dispatchEvent(new Event("input"));
    expect(el.getAttribute("data-wp-bar")).toBe("y");
    box.sh = 50;
    el.dispatchEvent(new Event("input"));
    expect(el.hasAttribute("data-wp-bar")).toBe(false);
    stop();
    box.sh = 300;
    el.dispatchEvent(new Event("input"));
    expect(el.hasAttribute("data-wp-bar")).toBe(false);
    el.remove();
  });
});
