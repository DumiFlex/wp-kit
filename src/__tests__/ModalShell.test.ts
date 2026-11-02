import { afterEach, describe, expect, it } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import ModalShell from "../ModalShell.vue";

/** The element, or a failed test that names what was missing. */
function must<T>(v: T | null | undefined, what: string): T {
  if (v == null) throw new Error(`missing ${what}`);
  return v;
}

let w: VueWrapper | null = null;
afterEach(() => {
  w?.unmount();
  w = null;
  document.body.innerHTML = "";
});

describe("ModalShell", () => {
  it("names the dialog by a label or by its title's id", () => {
    w = mount(ModalShell, { props: { visible: true, label: "Seeds" }, attachTo: document.body });
    let d = must(document.body.querySelector('[role="dialog"]'), "dialog");
    expect(d.getAttribute("aria-label")).toBe("Seeds");
    w.unmount();
    w = mount(ModalShell, { props: { visible: true, labelledby: "t1" }, attachTo: document.body });
    d = must(document.body.querySelector('[role="dialog"]'), "dialog");
    expect(d.getAttribute("aria-labelledby")).toBe("t1");
    expect(d.hasAttribute("aria-label")).toBe(false);
  });

  it("closes on Escape and on the overlay", async () => {
    w = mount(ModalShell, { props: { visible: true }, attachTo: document.body });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    const overlay = must(document.body.querySelector<HTMLElement>(".wp-modal-overlay"), "overlay");
    overlay.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    overlay.click();
    expect(w.emitted("close")).toEqual([["escape"], ["backdrop"]]);
  });

  it("ignores a click inside, and a drag that started inside and ended on the overlay", async () => {
    w = mount(ModalShell, { props: { visible: true }, slots: { default: '<p class="in">Hi</p>' }, attachTo: document.body });
    const inner = must(document.body.querySelector<HTMLElement>(".in"), "content");
    inner.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    inner.click();
    must(document.body.querySelector<HTMLElement>(".wp-modal-overlay"), "overlay").click();
    expect(w.emitted("close")).toBeUndefined();
  });
});
