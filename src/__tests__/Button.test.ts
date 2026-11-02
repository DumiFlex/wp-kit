import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import Button from "../Button.vue";

describe("Button.vue", () => {
  it("renders variant + size class", () => {
    const wrap = mount(Button, {
      props: { variant: "primary", size: "sm" },
      slots: { default: "Save" },
    });
    const cls = wrap.get("button").classes();
    expect(cls).toContain("wp-btn");
    expect(cls).toContain("wp-btn--primary");
    expect(cls).toContain("wp-btn--sm");
  });

  it("emits click and forwards ariaLabel", async () => {
    const wrap = mount(Button, {
      props: { ariaLabel: "Save changes" },
      slots: { default: "Save" },
    });
    expect(wrap.get("button").attributes("aria-label")).toBe("Save changes");
    await wrap.get("button").trigger("click");
    expect(wrap.emitted("click")).toBeTruthy();
  });

  it("does not emit click when disabled", async () => {
    const wrap = mount(Button, { props: { disabled: true }, slots: { default: "x" } });
    await wrap.get("button").trigger("click");
    expect(wrap.emitted("click")).toBeFalsy();
  });
});

// ---------- Variant × State matrix ----------

const VARIANTS = ["primary", "secondary", "ghost", "danger", "link", "outline"] as const;

describe("Button variants × states", () => {
  for (const variant of VARIANTS) {
    describe(variant, () => {
      it("renders default state", () => {
        const wrap = mount(Button, { props: { variant }, slots: { default: "X" } });
        const btn = wrap.get("button");
        expect(btn.classes()).toContain(`wp-btn--${variant}`);
        expect(btn.attributes("disabled")).toBeUndefined();
        expect(btn.attributes("aria-busy")).toBeUndefined();
      });

      it("renders disabled state", () => {
        const wrap = mount(Button, { props: { variant, disabled: true }, slots: { default: "X" } });
        const btn = wrap.get("button");
        expect(btn.attributes("disabled")).toBeDefined();
        expect(btn.attributes("aria-busy")).toBeUndefined();
      });

      it("renders loading state (aria-busy + disabled + spinner)", () => {
        const wrap = mount(Button, { props: { variant, loading: true }, slots: { default: "X" } });
        const btn = wrap.get("button");
        expect(btn.attributes("aria-busy")).toBe("true");
        expect(btn.attributes("disabled")).toBeDefined();
        expect(btn.find("[data-test='loading-mark']").exists()).toBe(true);
        expect(btn.find(".pi-spinner").exists()).toBe(false);
      });

      it("does not emit click when loading", async () => {
        const wrap = mount(Button, { props: { variant, loading: true }, slots: { default: "X" } });
        await wrap.get("button").trigger("click");
        expect(wrap.emitted("click")).toBeFalsy();
      });

      it("forwards icon prop and aria-label", () => {
        const wrap = mount(Button, {
          props: { variant, icon: "pi-plus", ariaLabel: `${variant} action` },
        });
        const btn = wrap.get("button");
        expect(btn.attributes("aria-label")).toBe(`${variant} action`);
        expect(btn.find(".pi-plus").exists()).toBe(true);
      });
    });
  }
});

/** Hover the button and return the open tooltip's text (and key chip). */
function tipOf(el: Element): { text: string | null; kbd: string | null } {
  el.dispatchEvent(new PointerEvent("pointerenter"));
  vi.advanceTimersByTime(500);
  const tip = document.querySelector(".wp-tooltip[data-open]");
  const kbd = tip?.querySelector(".wp-tooltip__kbd")?.textContent ?? null;
  const text = tip ? (tip.firstChild?.textContent ?? tip.textContent) : null;
  el.dispatchEvent(new PointerEvent("pointerleave"));
  return { text, kbd };
}

describe("Button — tooltip", () => {
  afterEach(() => { vi.useRealTimers(); document.body.innerHTML = ""; });

  it("an icon button shows its aria-label, with a key chip from kbd", () => {
    vi.useFakeTimers();
    const w = mount(Button, { props: { icon: "times", ariaLabel: "Close", kbd: "Esc" }, attachTo: document.body });
    expect(tipOf(w.element)).toEqual({ text: "Close", kbd: "Esc" });
    expect(w.attributes("title")).toBeUndefined();
  });

  it("a button with text has no tooltip unless hint asks for one", async () => {
    vi.useFakeTimers();
    const w = mount(Button, { props: { ariaLabel: "Edit" }, slots: { default: "Edit" }, attachTo: document.body });
    expect(tipOf(w.element).text).toBeNull();
    await w.setProps({ hint: "Edit the module" });
    expect(tipOf(w.element).text).toBe("Edit the module");
  });
});

describe("Button — canvas and link uses (WpButton and CloseButton were folded in)", () => {
  it("takes the canvas size and a pi- icon name", () => {
    const w = mount(Button, { props: { size: "sm", icon: "pi-plus" }, slots: { default: "Add" } });
    expect(w.classes()).toEqual(expect.arrayContaining(["wp-btn", "wp-btn--secondary", "wp-btn--sm"]));
    expect(w.find("i.pi.pi-plus").exists()).toBe(true);
  });

  it("a ghost × icon button is the close button", () => {
    const w = mount(Button, { props: { variant: "ghost", icon: "times", ariaLabel: "Close" } });
    expect(w.classes()).toEqual(expect.arrayContaining(["wp-btn--ghost", "wp-btn--icon"]));
    expect(w.find("i.pi-times").exists()).toBe(true);
  });

  it('as="a" is a link; disabled takes it out of reach and stops the click', async () => {
    const w = mount(Button, { props: { as: "a", variant: "link" }, attrs: { href: "/docs" }, slots: { default: "Docs" } });
    expect(w.element.tagName).toBe("A");
    expect(w.attributes("href")).toBe("/docs");
    expect(w.attributes("type")).toBeUndefined();
    await w.trigger("click");
    expect(w.emitted("click")).toHaveLength(1);
    await w.setProps({ disabled: true });
    expect(w.attributes("aria-disabled")).toBe("true");
    expect(w.attributes("tabindex")).toBe("-1");
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
    w.element.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(w.emitted("click")).toHaveLength(1);
  });
});
