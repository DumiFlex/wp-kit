import { afterEach, describe, expect, it, vi } from "vitest";
import { effectScope } from "vue";
import { COPIED_MS, useCopied } from "./useCopied";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function stubClipboard(ok = true) {
  const writeText = ok ? vi.fn(async () => undefined) : vi.fn(async () => { throw new Error("no"); });
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  return writeText;
}

describe("useCopied", () => {
  it("copies and holds the key for COPIED_MS", async () => {
    vi.useFakeTimers();
    const write = stubClipboard();
    const c = useCopied<string>();
    expect(await c.copy("hello", "row-1")).toBe(true);
    expect(write).toHaveBeenCalledWith("hello");
    expect(c.copied.value).toBe("row-1");
    expect(c.is("row-1")).toBe(true);
    expect(c.is("row-2")).toBe(false);
    vi.advanceTimersByTime(COPIED_MS);
    expect(c.copied.value).toBeNull();
  });

  it("one button: no key needed, and a function text is built on click", async () => {
    stubClipboard();
    const c = useCopied();
    expect(await c.copy(async () => "built")).toBe(true);
    expect(c.is()).toBe(true);
  });

  it("an empty text or a throwing builder fails", async () => {
    stubClipboard();
    const c = useCopied<string>();
    expect(await c.copy("", "a")).toBe(false);
    expect(c.failed.value).toBe("a");
    expect(await c.copy(() => { throw new Error("x"); }, "b")).toBe(false);
    expect(c.failed.value).toBe("b");
    expect(c.copied.value).toBeNull();
  });

  it("a second copy moves the check to the new key", async () => {
    stubClipboard();
    const c = useCopied<number>();
    await c.copy("a", 1);
    await c.copy("b", 2);
    expect(c.is(1)).toBe(false);
    expect(c.is(2)).toBe(true);
  });

  it("stops its timer with the scope", async () => {
    vi.useFakeTimers();
    stubClipboard();
    const scope = effectScope();
    const c = scope.run(() => useCopied());
    await c?.copy("x");
    scope.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});
