import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import Combobox from "../Combobox.vue";
import ContextMenu from "../ContextMenu.vue";
import Select from "../Select.vue";

// One menu look (menu.css) for Select's list, ContextMenu / DropdownMenu and
// Combobox's list: the floating panel carries `wp-menu`, each row
// `wp-menu__item`.

function must<T>(v: T | null | undefined): T {
  if (v == null) throw new Error("missing");
  return v;
}

const opts = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma" },
];

function rect(top: number, left = 20, width = 200, height = 32): DOMRect {
  return { top, bottom: top + height, left, right: left + width, width, height, x: left, y: top, toJSON: () => ({}) };
}

afterEach(() => { document.body.innerHTML = ""; });

describe("shared menu look", () => {
  it("Select's list floats in a wp-menu panel with wp-menu__item rows", async () => {
    const w = mount(Select, { props: { modelValue: null, options: opts }, attachTo: document.body });
    await w.get("[data-test='select-trigger']").trigger("click");
    await nextTick();
    const list = must(document.querySelector<HTMLElement>("[data-test='select-menu']"));
    expect(list.closest(".wp-menu")).not.toBeNull();
    expect(document.querySelectorAll(".wp-select__option.wp-menu__item").length).toBe(3);
    w.unmount();
  });

  it("ContextMenu's list is a wp-menu with wp-menu__item rows", async () => {
    const w = mount(ContextMenu, {
      props: { visible: false, x: 10, y: 10, items: [{ label: "Copy", onSelect: () => {} }, { label: "Delete", onSelect: () => {} }] },
      attachTo: document.body,
    });
    await w.setProps({ visible: true });
    await nextTick();
    const menu = must(document.querySelector<HTMLElement>(".wp-ctxmenu"));
    expect(menu.classList.contains("wp-menu")).toBe(true);
    expect(menu.querySelectorAll(".wp-menu__item").length).toBe(2);
    w.unmount();
  });

  it("Combobox's list floats in a wp-menu panel with wp-menu__item rows", async () => {
    const w = mount(Combobox, { props: { modelValue: null, options: opts, ariaLabel: "Letter" }, attachTo: document.body });
    await w.get("input").trigger("focus");
    await nextTick();
    await nextTick();
    const list = must(document.querySelector<HTMLElement>(".wp-combo__list"));
    expect(list.closest(".wp-menu")).not.toBeNull();
    expect(list.querySelectorAll(".wp-menu__item").length).toBe(3);
    w.unmount();
  });

  it("marks the keyboard's row the same way in every menu", async () => {
    const sel = mount(Select, { props: { modelValue: null, options: opts }, attachTo: document.body });
    const t = sel.get("[data-test='select-trigger']");
    await t.trigger("click");
    await t.trigger("keydown", { key: "ArrowDown" });
    expect(document.querySelector(".wp-menu__item[data-active='true']")?.textContent).toContain("Beta");
    sel.unmount();

    const cm = mount(ContextMenu, {
      props: { visible: false, x: 0, y: 0, items: [{ label: "Copy", onSelect: () => {} }] },
      attachTo: document.body,
    });
    await cm.setProps({ visible: true });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    await nextTick();
    expect(document.querySelector(".wp-menu__item[data-active='true']")?.textContent).toContain("Copy");
    cm.unmount();
  });
});

describe("Select list in the menu Popover", () => {
  it("Home and End jump to the first and last option", async () => {
    const w = mount(Select, { props: { modelValue: null, options: opts }, attachTo: document.body });
    const t = w.get("[data-test='select-trigger']");
    await t.trigger("click");
    await t.trigger("keydown", { key: "End" });
    await t.trigger("keydown", { key: "Enter" });
    expect(w.emitted("update:modelValue")?.[0]).toEqual(["c"]);
    await t.trigger("click");
    await t.trigger("keydown", { key: "Home" });
    await t.trigger("keydown", { key: "Enter" });
    expect(w.emitted("update:modelValue")?.[1]).toEqual(["a"]);
    w.unmount();
  });

  it("picks an option on press, closes and gives focus back to the trigger", async () => {
    const w = mount(Select, { props: { modelValue: null, options: opts }, attachTo: document.body });
    const t = w.get("[data-test='select-trigger']");
    await t.trigger("click");
    const beta = must([...document.querySelectorAll<HTMLElement>(".wp-select__option")][1]);
    beta.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    await nextTick();
    await nextTick();
    expect(w.emitted("update:modelValue")?.[0]).toEqual(["b"]);
    expect(document.querySelector(".wp-select__menu")).toBeNull();
    expect(document.activeElement).toBe(t.element);
    w.unmount();
  });

  it("Escape closes the list and gives focus back to the trigger", async () => {
    const w = mount(Select, { props: { modelValue: null, options: opts }, attachTo: document.body });
    const t = w.get("[data-test='select-trigger']");
    await t.trigger("click");
    await t.trigger("keydown", { key: "Escape" });
    expect(document.querySelector(".wp-select__menu")).toBeNull();
    expect(document.activeElement).toBe(t.element);
    expect(t.attributes("aria-expanded")).toBe("false");
    w.unmount();
  });

  it("opens above the trigger when there is no room below, 4px from it", async () => {
    const w = mount(Select, { props: { modelValue: null, options: opts }, attachTo: document.body });
    const t = w.get("[data-test='select-trigger']");
    (t.element as HTMLElement).getBoundingClientRect = () => rect(window.innerHeight - 40);
    await t.trigger("click");
    await nextTick();
    const panel = must(document.querySelector<HTMLElement>(".wp-select__menu")?.closest<HTMLElement>(".wp-popover"));
    // jsdom lays nothing out, so give the panel a height to place.
    Object.defineProperty(panel, "scrollHeight", { value: 120, configurable: true });
    window.dispatchEvent(new Event("resize"));
    await nextTick();
    expect(panel.dataset.side).toBe("top");
    expect(panel.style.top).toBe(`${window.innerHeight - 40 - 4 - 120}px`);
    w.unmount();
  });

  it("caps the list at 240px and at the room on its side", async () => {
    const w = mount(Select, { props: { modelValue: null, options: opts }, attachTo: document.body });
    const t = w.get("[data-test='select-trigger']");
    (t.element as HTMLElement).getBoundingClientRect = () => rect(100);
    await t.trigger("click");
    await nextTick();
    const panel = must(document.querySelector<HTMLElement>(".wp-select__menu")?.closest<HTMLElement>(".wp-popover"));
    Object.defineProperty(panel, "scrollHeight", { value: 900, configurable: true });
    window.dispatchEvent(new Event("resize"));
    await nextTick();
    expect(panel.style.maxHeight).toBe("240px");
    // A short window: 300 - (120 + 32) - 4px gap - 8px margin = 136px below,
    // more than above, so it stays below and scrolls in what fits.
    const tall = window.innerHeight;
    Object.defineProperty(window, "innerHeight", { value: 300, configurable: true });
    (t.element as HTMLElement).getBoundingClientRect = () => rect(120);
    window.dispatchEvent(new Event("resize"));
    await nextTick();
    expect(panel.dataset.side).toBe("bottom");
    expect(panel.style.maxHeight).toBe("136px");
    Object.defineProperty(window, "innerHeight", { value: tall, configurable: true });
    w.unmount();
  });
});
