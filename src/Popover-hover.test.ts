import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import Popover from "./Popover.vue";

afterEach(() => {
  document.body.innerHTML = "";
  vi.useRealTimers();
});

function hoverHost(extra: Record<string, unknown> = {}) {
  const open = ref(false);
  const Host = defineComponent({
    setup() {
      return () => h(Popover, { open: open.value, trigger: "hover", label: "Card", ...extra, "onUpdate:open": (v: boolean) => { open.value = v; } }, {
        trigger: ({ props }: { props: Record<string, unknown> }) => h("button", { ...props, type: "button", class: "trig" }, "Ref"),
        default: () => h("button", { type: "button", class: "inside" }, "Open it"),
      });
    },
  });
  return { open, Host };
}

const panel = () => document.querySelector<HTMLElement>(".wp-popover");

describe("Popover trigger=hover", () => {
  it("opens after the open delay and not before", async () => {
    vi.useFakeTimers();
    const { open, Host } = hoverHost();
    const w = mount(Host, { attachTo: document.body });
    await w.find(".wp-popover-anchor").trigger("mouseenter");
    vi.advanceTimersByTime(200);
    expect(open.value).toBe(false);
    vi.advanceTimersByTime(100);
    expect(open.value).toBe(true);
    w.unmount();
  });

  it("doesn't open when the pointer leaves before the delay", async () => {
    vi.useFakeTimers();
    const { open, Host } = hoverHost();
    const w = mount(Host, { attachTo: document.body });
    const a = w.find(".wp-popover-anchor");
    await a.trigger("mouseenter");
    vi.advanceTimersByTime(100);
    await a.trigger("mouseleave");
    vi.advanceTimersByTime(500);
    expect(open.value).toBe(false);
    w.unmount();
  });

  it("stays open while the pointer crosses into the card, closes after it leaves", async () => {
    vi.useFakeTimers();
    const { open, Host } = hoverHost({ openDelay: 0, closeDelay: 100 });
    const w = mount(Host, { attachTo: document.body });
    const a = w.find(".wp-popover-anchor");
    await a.trigger("mouseenter");
    vi.advanceTimersByTime(0);
    await nextTick();
    expect(panel()).not.toBeNull();
    await a.trigger("mouseleave");
    vi.advanceTimersByTime(50);
    panel()?.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(500);
    expect(open.value).toBe(true);
    panel()?.dispatchEvent(new MouseEvent("mouseleave"));
    vi.advanceTimersByTime(100);
    expect(open.value).toBe(false);
    w.unmount();
  });

  it("leaves focus on the trigger when it opens", async () => {
    vi.useFakeTimers();
    const { Host } = hoverHost({ openDelay: 0 });
    const w = mount(Host, { attachTo: document.body });
    const trig = w.find<HTMLButtonElement>(".trig");
    trig.element.focus();
    await trig.trigger("focusin");
    vi.advanceTimersByTime(0);
    await nextTick();
    await nextTick();
    expect(panel()).not.toBeNull();
    expect(document.activeElement).toBe(trig.element);
    w.unmount();
  });

  it("listens on an anchor element when there is no trigger slot", async () => {
    vi.useFakeTimers();
    const el = document.createElement("span");
    document.body.appendChild(el);
    const open = ref(false);
    const Host = defineComponent({
      setup() {
        return () => h(Popover, { open: open.value, trigger: "hover", anchor: el, openDelay: 10, "onUpdate:open": (v: boolean) => { open.value = v; } }, { default: () => h("p", "card") });
      },
    });
    const w = mount(Host, { attachTo: document.body });
    el.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(10);
    expect(open.value).toBe(true);
    w.unmount();
    el.dispatchEvent(new MouseEvent("mouseenter"));
  });

  it("a click popover still takes focus by default", async () => {
    const open = ref(true);
    const w = mount(Popover, { attachTo: document.body, props: { open: open.value }, slots: { trigger: ({ props }: { props: Record<string, unknown> }) => h("button", props, "x"), default: () => h("input", { class: "in", "aria-label": "n" }) } });
    await nextTick(); await nextTick();
    expect(document.activeElement?.classList.contains("in")).toBe(true);
    w.unmount();
  });
});
