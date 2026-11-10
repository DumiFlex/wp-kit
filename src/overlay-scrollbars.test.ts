import { afterEach, describe, expect, it } from "vitest";
import { BAR_ROOM_PX, hasOverlayScrollbars, markOverlayScrollbars } from "./overlay-scrollbars";

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
