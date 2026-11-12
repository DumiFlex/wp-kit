import { describe, expect, it } from "vitest";
import { useListNav } from "./useListNav";

const key = (k: string) => new KeyboardEvent("keydown", { key: k, cancelable: true });

describe("useListNav", () => {
  it("steps and wraps, landing on the first or last row from nothing", () => {
    const nav = useListNav({ count: () => 3 });
    nav.step(1);
    expect(nav.active.value).toBe(0);
    nav.step(-1);
    expect(nav.active.value).toBe(2);
    nav.step(1);
    expect(nav.active.value).toBe(0);
    nav.reset();
    nav.step(-1);
    expect(nav.active.value).toBe(2);
  });

  it("skips disabled rows and stops at the ends without wrap", () => {
    const nav = useListNav({ count: () => 4, disabled: (i) => i === 1, wrap: false });
    nav.step(1);
    nav.step(1);
    expect(nav.active.value).toBe(2);
    nav.step(1);
    nav.step(1);
    expect(nav.active.value).toBe(3);
    nav.first();
    expect(nav.active.value).toBe(0);
    nav.set(1);
    expect(nav.active.value).toBe(0);
  });

  it("onKey: arrows, Enter picks, Home/End only when asked, other keys pass", () => {
    const picked: number[] = [];
    const nav = useListNav({ count: () => 3, idPrefix: "l" });
    const down = key("ArrowDown");
    expect(nav.onKey(down, (i) => picked.push(i))).toBe(true);
    expect(down.defaultPrevented).toBe(true);
    expect(nav.activeId.value).toBe("l-0");
    expect(nav.onKey(key("Enter"), (i) => picked.push(i))).toBe(true);
    expect(picked).toEqual([0]);
    expect(nav.onKey(key("End"))).toBe(false);
    expect(nav.onKey(key("a"))).toBe(false);
    const withEdges = useListNav({ count: () => 3, homeEnd: true });
    withEdges.onKey(key("End"));
    expect(withEdges.active.value).toBe(2);
    withEdges.onKey(key("Home"));
    expect(withEdges.active.value).toBe(0);
  });

  it("does nothing on an empty list", () => {
    const nav = useListNav({ count: () => 0 });
    expect(nav.onKey(key("ArrowDown"))).toBe(false);
    expect(nav.onKey(key("Enter"), () => undefined)).toBe(false);
    expect(nav.activeId.value).toBeUndefined();
  });
});
