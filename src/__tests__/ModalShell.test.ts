import { afterEach, describe, expect, it } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import ModalShell from "../ModalShell.vue";

let w: VueWrapper | null = null;
afterEach(() => {
  w?.unmount();
  w = null;
  document.body.innerHTML = "";
});

describe("ModalShell", () => {
  it("names the dialog by a label or by its title's id", () => {
    w = mount(ModalShell, { props: { visible: true, label: "Seeds" }, attachTo: document.body });
    let d = document.body.querySelector('[role="dialog"]')!;
    expect(d.getAttribute("aria-label")).toBe("Seeds");
    w.unmount();
    w = mount(ModalShell, { props: { visible: true, labelledby: "t1" }, attachTo: document.body });
    d = document.body.querySelector('[role="dialog"]')!;
    expect(d.getAttribute("aria-labelledby")).toBe("t1");
    expect(d.hasAttribute("aria-label")).toBe(false);
  });

  it("closes on Escape and on the overlay", async () => {
    w = mount(ModalShell, { props: { visible: true }, attachTo: document.body });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    (document.body.querySelector(".wp-modal-overlay") as HTMLElement).click();
    expect(w.emitted("close")).toHaveLength(2);
  });
});
