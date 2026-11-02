import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import Modal from "../Modal.vue";

describe("Modal.vue", () => {
  // ModalShell's Transition keeps a closing dialog in the page until its CSS
  // transition ends, which jsdom never fires: clear it between tests.
  afterEach(() => { document.body.innerHTML = ""; });

  it("renders teleported when open=true", () => {
    const wrap = mount(Modal, {
      props: { open: true, title: "Confirm" },
      slots: { default: "<p>Body</p>" },
      attachTo: document.body,
    });
    expect(document.body.querySelector(".wp-modal")).not.toBeNull();
    expect(document.body.querySelector(".wp-modal__title")?.textContent).toBe("Confirm");
    wrap.unmount();
  });

  it("emits update:open=false on backdrop click", async () => {
    const wrap = mount(Modal, {
      props: { open: true },
      slots: { default: "<p>x</p>" },
      attachTo: document.body,
    });
    const backdrop = document.body.querySelector("[data-test='modal-backdrop']") as HTMLElement;
    backdrop.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    backdrop.click();
    expect(wrap.emitted("update:open")?.[0]).toEqual([false]);
    wrap.unmount();
  });

  it("close-on-backdrop=false keeps it open on a backdrop click, Escape still closes", async () => {
    const wrap = mount(Modal, {
      props: { open: true, closeOnBackdrop: false, title: "Form" },
      slots: { default: "<input />" },
      attachTo: document.body,
    });
    const backdrop = document.body.querySelector("[data-test='modal-backdrop']") as HTMLElement;
    backdrop.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    backdrop.click();
    expect(wrap.emitted("update:open")).toBeUndefined();
    document.body.querySelector("input")?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    expect(wrap.emitted("update:open")?.[0]).toEqual([false]);
    wrap.unmount();
  });

  it("keeps keys pressed inside away from window, and hands them to keydown", async () => {
    const wrap = mount(Modal, { props: { open: true, title: "Edit" }, slots: { default: "<input />" }, attachTo: document.body });
    await nextTick();
    let reached = false;
    const onWin = (): void => { reached = true; };
    window.addEventListener("keydown", onWin);
    document.body.querySelector("input")?.dispatchEvent(new KeyboardEvent("keydown", { key: "r", bubbles: true }));
    window.removeEventListener("keydown", onWin);
    expect(reached).toBe(false);
    expect(wrap.emitted("keydown")?.length).toBe(1);
    wrap.unmount();
  });

  it("moves focus in, keeps Tab inside, and gives it back on close", async () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    const wrap = mount(Modal, {
      props: { open: false, title: "Edit" },
      slots: { default: '<input data-test="a" /><button data-test="b">B</button>' },
      attachTo: document.body,
    });
    await wrap.setProps({ open: true });
    await nextTick();
    const a = document.body.querySelector("[data-test='a']") as HTMLElement;
    const b = document.body.querySelector("[data-test='b']") as HTMLElement;
    const close = document.body.querySelector("[aria-label='Close']") as HTMLElement;
    expect(document.activeElement).toBe(a);
    const dialog = document.body.querySelector("[role='dialog']") as HTMLElement;
    expect(dialog.getAttribute("aria-labelledby")).toBe(document.body.querySelector(".wp-modal__title")?.id);
    // Close is first in the dialog, B last: Tab from B wraps to Close.
    // Keys pressed inside go through ModalShell's shield to the trap.
    b.focus();
    b.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(close);
    close.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(b);
    await wrap.setProps({ open: false });
    expect(document.activeElement).toBe(opener);
    wrap.unmount();
    opener.remove();
  });
});
