import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import Badge from "./Badge.vue";
import CodeBlock from "./CodeBlock.vue";
import DescriptionList from "./DescriptionList.vue";
import DropZone from "./DropZone.vue";
import InlineEdit from "./InlineEdit.vue";
import Kbd from "./Kbd.vue";
import Pagination from "./Pagination.vue";
import ProgressBar from "./ProgressBar.vue";
import ResizeHandle from "./ResizeHandle.vue";
import Separator from "./Separator.vue";
import Skeleton from "./Skeleton.vue";
import Slider from "./Slider.vue";
import SortableList from "./SortableList.vue";
import SplitPane from "./SplitPane.vue";
import Stepper from "./Stepper.vue";
import TagInput from "./TagInput.vue";
import Toolbar from "./Toolbar.vue";
import { acceptList, dragItemMaybeAccepted, fileAccepted, formatBytes } from "./drop-zone";
import { pageItems } from "./pagination";
import { keyStep, keyToMark, percentOf, snap, snapToMarks, valueAt } from "./slider-math";
import { dropIndex, dropTarget, inDropGap, moveItem, targetIndex } from "./sortable";

const mounted: { unmount: () => void }[] = [];

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount());
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

/** jsdom has no PointerEvent; a MouseEvent carries the same fields we read. */
async function point(el: { element: Element }, type: string, init: MouseEventInit): Promise<void> {
  el.element.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, ...init }));
  await nextTick();
}

/** Mount with v-model wired back, so the component sees its own updates. */
function bound<P extends Record<string, unknown>>(comp: unknown, props: P, extra: Record<string, unknown> = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper over many components
  const w: any = mount(comp as never, {
    props: { ...props, "onUpdate:modelValue": (v: unknown) => w.setProps({ modelValue: v }) } as never,
    attachTo: document.body,
    ...extra,
  });
  mounted.push(w);
  return w;
}

describe("pure helpers", () => {
  it("pageItems keeps the first, last and neighbours, with gaps", () => {
    expect(pageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageItems(1, 10)).toEqual([1, 2, 3, 4, 5, "gap-end", 10]);
    expect(pageItems(5, 10)).toEqual([1, "gap-start", 4, 5, 6, "gap-end", 10]);
    expect(pageItems(10, 10)).toEqual([1, "gap-start", 6, 7, 8, 9, 10]);
    expect(pageItems(4, 10)).toEqual([1, 2, 3, 4, 5, "gap-end", 10]);
    expect(pageItems(1, 0)).toEqual([]);
  });

  it("slider maths snaps, clamps and steps without float fuzz", () => {
    expect(snap(0.30000000000000004, 0, 1, 0.1)).toBe(0.3);
    expect(snap(7, 0, 5, 1)).toBe(5);
    expect(snap(-3, 0, 5, 1)).toBe(0);
    expect(snap(13, 4, 160, 4)).toBe(12);
    expect(percentOf(50, 0, 200)).toBe(25);
    expect(valueAt(150, 100, 200, 0, 100, 1)).toBe(25);
    expect(keyStep("ArrowRight", 1, 0, 2, 0.05)).toBe(1.05);
    expect(keyStep("PageDown", 1, 0, 2, 0.05)).toBe(0.5);
    expect(keyStep("End", 1, 0, 2, 0.05)).toBe(2);
    expect(keyStep("a", 1, 0, 2, 0.05)).toBeNull();
  });

  it("sortable finds the row and edge a drop lands on", () => {
    const b = [{ top: 0, bottom: 20 }, { top: 22, bottom: 42 }];
    expect(dropTarget(5, b)).toEqual({ over: 0, edge: "before" });
    expect(dropTarget(15, b)).toEqual({ over: 0, edge: "after" });
    expect(dropTarget(21, b)).toEqual({ over: 1, edge: "before" });
    expect(dropTarget(50, b)).toEqual({ over: 1, edge: "end" });
    expect(dropTarget(5, [])).toBeNull();
    // The gap a target opened keeps it: a pointer on the line stays put.
    expect(inDropGap(24, { top: 0, bottom: 20 }, "after", 14)).toBe(true);
    expect(inDropGap(24, { top: 0, bottom: 20 }, "end", 14)).toBe(true);
    expect(inDropGap(35, { top: 0, bottom: 20 }, "after", 14)).toBe(false);
    expect(inDropGap(25, { top: 30, bottom: 50 }, "before", 14)).toBe(true);
    expect(inDropGap(10, { top: 30, bottom: 50 }, "before", 14)).toBe(false);
    expect(inDropGap(24, { top: 0, bottom: 20 }, "after", 0)).toBe(false);
    expect(targetIndex(0, { over: 2, edge: "after" })).toBe(2);
    expect(targetIndex(2, { over: 0, edge: "before" })).toBe(0);
    expect(targetIndex(1, { over: 0, edge: "after" })).toBe(1);
    expect(targetIndex(0, { over: 2, edge: "end" })).toBe(2);
  });

  it("sortable moves an item and finds where a drag lands", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    const mids = [10, 30, 50, 70];
    expect(dropIndex(5, mids, 2)).toBe(0);
    expect(dropIndex(60, mids, 0)).toBe(2);
    expect(dropIndex(99, mids, 0)).toBe(3);
  });

  it("drop zone matches accept lists like the file input", () => {
    expect(acceptList(" image/*, .TXT ")).toEqual(["image/*", ".txt"]);
    expect(fileAccepted({ name: "a.png", type: "image/png" }, "image/*")).toBe(true);
    expect(fileAccepted({ name: "list.TXT", type: "" }, ".txt,.yaml")).toBe(true);
    expect(fileAccepted({ name: "x.exe", type: "application/x-msdownload" }, ".txt,image/*")).toBe(false);
    expect(fileAccepted({ name: "x.exe", type: "" }, undefined)).toBe(true);
    expect(dragItemMaybeAccepted("application/pdf", "image/*")).toBe(false);
    expect(dragItemMaybeAccepted("application/pdf", "image/*,.txt")).toBe(true);
    expect(dragItemMaybeAccepted("", "image/*")).toBe(true);
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
    expect(formatBytes(20 * 1024 * 1024)).toBe("20 MB");
    expect(formatBytes(2048)).toBe("2 KB");
  });
});

describe("ProgressBar", () => {
  it("reports a known value and says busy when it is not known", async () => {
    const w = mount(ProgressBar, { props: { value: 50, max: 200, label: "Seeds", showValue: true } });
    const bar = w.find("[role=progressbar]");
    expect(bar.attributes("aria-valuenow")).toBe("50");
    expect(bar.attributes("aria-valuetext")).toBe("25%");
    expect(w.text()).toContain("25%");
    await w.setProps({ value: null });
    expect(bar.attributes("aria-valuenow")).toBeUndefined();
    expect(bar.attributes("aria-busy")).toBe("true");
  });
});

describe("Skeleton, Separator, Kbd", () => {
  it("skeleton hides its shapes and says Loading once", () => {
    const w = mount(Skeleton, { props: { shape: "row", lines: 3, label: "Loading modules" } });
    expect(w.attributes("role")).toBe("status");
    expect(w.text()).toBe("Loading modules…");
    expect(w.findAll(".wp-skeleton__row")).toHaveLength(3);
  });

  it("skeleton draws a run of pills, and square icon tiles for item rows", () => {
    const chips = mount(Skeleton, { props: { shape: "chip", lines: 4, height: "24px" } });
    const pills = chips.findAll(".wp-skeleton__chip");
    expect(pills).toHaveLength(4);
    expect(pills[0]?.attributes("style")).toContain("height: 24px");
    expect(new Set(pills.map((p) => p.attributes("style"))).size).toBeGreaterThan(1);
    const rows = mount(Skeleton, { props: { shape: "row", lines: 2, icon: "square" } });
    expect(rows.findAll(".wp-skeleton__tile")).toHaveLength(2);
    expect(rows.find(".wp-skeleton__circle").exists()).toBe(false);
  });

  it("separator is decorative unless asked, and carries text", () => {
    expect(mount(Separator).attributes("role")).toBe("none");
    const w = mount(Separator, { props: { decorative: false, orientation: "vertical" } });
    expect(w.attributes("role")).toBe("separator");
    expect(w.attributes("aria-orientation")).toBe("vertical");
    expect(mount(Separator, { props: { label: "or" } }).text()).toBe("or");
  });

  it("kbd turns Mod into Ctrl or ⌘ and speaks the chord", () => {
    vi.stubGlobal("navigator", { userAgent: "Windows" });
    const w = mount(Kbd, { props: { keys: "Mod+Shift+K" } });
    expect(w.findAll(".wp-kbd-keys__cap").map((k) => k.text())).toEqual(["Ctrl", "Shift", "K"]);
    expect(w.attributes("aria-label")).toBe("Control plus Shift plus K");
    vi.stubGlobal("navigator", { userAgent: "Macintosh" });
    const m = mount(Kbd, { props: { keys: ["Mod", "Enter"] } });
    expect(m.findAll(".wp-kbd-keys__cap").map((k) => k.text())).toEqual(["⌘", "↵"]);
    expect(m.attributes("aria-label")).toBe("Command plus Enter");
  });
});

describe("Badge", () => {
  it("caps the count, hides zero and names a corner badge", async () => {
    const w = mount(Badge, { props: { count: 120, label: "120 new" }, slots: { default: "<button>Inbox</button>" } });
    expect(w.find(".wp-badge--corner").text()).toBe("99+");
    expect(w.find(".wp-badge__sr").text()).toBe("120 new");
    await w.setProps({ count: 0 });
    expect(w.find(".wp-badge").exists()).toBe(false);
    await w.setProps({ showZero: true });
    expect(w.find(".wp-badge").text()).toBe("0");
  });

  it("a status dot shows its text and hides the dot itself", () => {
    const w = mount(Badge, { props: { dot: true, tone: "success", text: "Running" } });
    expect(w.text()).toBe("Running");
    expect(w.find(".wp-badge").attributes("aria-hidden")).toBe("true");
  });
});

describe("Stepper", () => {
  const steps = [{ id: "a", label: "One" }, { id: "b", label: "Two" }, { id: "c", label: "Three" }, { id: "d", label: "Four" }];

  it("marks done steps and the current one", () => {
    const w = mount(Stepper, { props: { modelValue: "b", steps } });
    const li = w.findAll("li");
    expect(li.map((l) => l.attributes("data-state"))).toEqual(["done", "current", "todo", "todo"]);
    expect(li[1].attributes("aria-current")).toBe("step");
  });

  it("linear: only done steps and the next one can be picked", async () => {
    const w = mount(Stepper, { props: { modelValue: "b", steps, clickable: true, linear: true } });
    const btn = w.findAll("button");
    expect(btn.map((b) => b.attributes("disabled") !== undefined)).toEqual([false, false, false, true]);
    await btn[0].trigger("click");
    await btn[1].trigger("click");
    expect(w.emitted("update:modelValue")).toEqual([["a"]]);
  });
});

describe("Toolbar", () => {
  it("is one Tab stop and moves with the arrows and Home/End", async () => {
    const w = mount(Toolbar, {
      props: { label: "Tools" },
      slots: { default: "<button>A</button><button disabled>B</button><button>C</button><button>D</button>" },
      attachTo: document.body,
    });
    await nextTick();
    const btn = () => w.findAll("button");
    expect(btn().map((b) => b.attributes("tabindex"))).toEqual(["0", undefined, "-1", "-1"]);
    (btn()[0].element as HTMLElement).focus();
    await btn()[0].trigger("keydown", { key: "ArrowRight" });
    expect(document.activeElement?.textContent).toBe("C");
    await btn()[2].trigger("keydown", { key: "End" });
    expect(document.activeElement?.textContent).toBe("D");
    await btn()[3].trigger("keydown", { key: "ArrowRight" });
    expect(document.activeElement?.textContent).toBe("A");
    expect(btn().map((b) => b.attributes("tabindex"))).toEqual(["0", undefined, "-1", "-1"]);
  });
});

describe("Pagination", () => {
  it("emits the page and marks the current one", async () => {
    const w = mount(Pagination, { props: { page: 2, total: 100, pageSize: 25 } });
    expect(w.find('[aria-current="page"]').text()).toBe("2");
    expect(w.text()).toContain("26–50 of 100");
    await w.find('[aria-label="Next page"]').trigger("click");
    await w.find('[aria-label="Page 4"]').trigger("click");
    expect(w.emitted("update:page")).toEqual([[3], [4]]);
  });

  it("draws nothing for one page, and a Load more in more mode", async () => {
    expect(mount(Pagination, { props: { total: 10, pageSize: 25 } }).find("nav").exists()).toBe(false);
    const w = mount(Pagination, { props: { mode: "more", total: 230, shown: 50, noun: "modules" } });
    expect(w.text()).toContain("Showing 50 of 230 modules");
    await w.find("button").trigger("click");
    expect(w.emitted("more")).toHaveLength(1);
    await w.setProps({ shown: 230 });
    expect(w.find("button").exists()).toBe(false);
  });
});

describe("DescriptionList and CodeBlock", () => {
  it("draws a dash for an empty value and fills a slot by key", () => {
    const w = mount(DescriptionList, {
      props: { items: [{ label: "Family", value: "SDXL" }, { label: "Notes", value: "" }, { label: "State", key: "state" }] },
      slots: { "value-state": "<b>Live</b>" },
    });
    expect(w.findAll("dt").map((d) => d.text())).toEqual(["Family", "Notes", "State"]);
    expect(w.findAll("dd").map((d) => d.text())).toEqual(["SDXL", "—", "Live"]);
  });

  it("code block toggles wrap and numbers lines", async () => {
    const w = mount(CodeBlock, { props: { code: "a\nb\n\nc", title: "Log", lineNumbers: true } });
    expect(w.findAll(".wp-code__num").map((n) => n.text())).toEqual(["1", "2", "3", "4"]);
    const wrap = w.find('[aria-label="Wrap lines"]');
    expect(wrap.attributes("aria-pressed")).toBe("false");
    await wrap.trigger("click");
    expect(w.emitted("update:wrap")).toEqual([[true]]);
    expect(w.find(".wp-code").attributes("data-wrap")).toBe("true");
  });
});

describe("Slider", () => {
  it("steps with the keys and clamps", async () => {
    const w = bound(Slider, { modelValue: 1, min: 0, max: 2, step: 0.5, ariaLabel: "Weight" });
    const thumb = w.find("[role=slider]");
    expect(thumb.attributes("aria-valuenow")).toBe("1");
    await thumb.trigger("keydown", { key: "ArrowRight" });
    expect(w.props("modelValue")).toBe(1.5);
    await thumb.trigger("keydown", { key: "PageUp" });
    expect(w.props("modelValue")).toBe(2);
    await thumb.trigger("keydown", { key: "Home" });
    expect(w.props("modelValue")).toBe(0);
    expect(w.emitted("change")?.length).toBe(3);
  });

  it("says the value in words and ignores keys when disabled", async () => {
    const w = bound(Slider, { modelValue: 32, min: 4, max: 160, format: (v: number) => `${v} px`, disabled: true });
    const thumb = w.find("[role=slider]");
    expect(thumb.attributes("aria-valuetext")).toBe("32 px");
    expect(thumb.attributes("tabindex")).toBe("-1");
    await thumb.trigger("keydown", { key: "ArrowRight" });
    expect(w.props("modelValue")).toBe(32);
  });

  it("with-input types the exact value through WpNumber", async () => {
    const w = bound(Slider, { modelValue: 10, min: 0, max: 20, withInput: true, ariaLabel: "Size" });
    const box = w.find("input");
    expect(box.attributes("aria-label")).toBe("Size, exact value");
    await box.setValue("25");
    await box.trigger("change");
    expect(w.props("modelValue")).toBe(20);
  });

  it("a pair keeps the ends apart by min-gap from the keys", async () => {
    const w = bound(Slider, { modelValue: [20, 30], min: 0, max: 100, minGap: 5, ariaLabel: "Range" });
    const [lo, hi] = w.findAll("[role=slider]");
    expect(lo.attributes("aria-valuemax")).toBe("25");
    expect(hi.attributes("aria-valuemin")).toBe("25");
    await lo.trigger("keydown", { key: "End" });
    expect(w.props("modelValue")).toEqual([25, 30]);
    await lo.trigger("keydown", { key: "ArrowRight" });
    expect(w.props("modelValue")).toEqual([25, 30]);
    await hi.trigger("keydown", { key: "Home" });
    expect(w.props("modelValue")).toEqual([25, 30]);
    await hi.trigger("keydown", { key: "ArrowRight" });
    expect(w.props("modelValue")).toEqual([25, 31]);
  });

  it("snapToMarks: true takes the nearest mark, a number only within reach", () => {
    expect(snapToMarks(30, [0, 25, 50], true)).toBe(25);
    expect(snapToMarks(40, [0, 25, 50], true)).toBe(50);
    expect(snapToMarks(27, [0, 25, 50], 3)).toBe(25);
    expect(snapToMarks(30, [0, 25, 50], 3)).toBe(30);
    expect(snapToMarks(30, [], true)).toBe(30);
    expect(snapToMarks(30, [25], false)).toBe(30);
  });

  it("keyToMark goes mark to mark, from on a mark or between two", () => {
    const m = [50, 0, 25, 100];
    expect(keyToMark("ArrowRight", 25, m)).toBe(50);
    expect(keyToMark("ArrowLeft", 25, m)).toBe(0);
    expect(keyToMark("ArrowRight", 30, m)).toBe(50);
    expect(keyToMark("ArrowLeft", 30, m)).toBe(25);
    expect(keyToMark("ArrowRight", 100, m)).toBe(100);
    expect(keyToMark("ArrowLeft", 0, m)).toBe(0);
    expect(keyToMark("PageUp", 0, m)).toBe(100);
    expect(keyToMark("Home", 50, m)).toBe(0);
    expect(keyToMark("End", 50, m)).toBe(100);
    expect(keyToMark("Enter", 50, m)).toBeNull();
  });

  const MARKS = [0, 25, 50, 100].map((value) => ({ value }));
  /** The track as 100px wide from x=0, so a pointer's x is its value on 0–100. */
  function track(w: { find: (s: string) => { element: Element } }) {
    const el = w.find(".wp-slider__track").element as HTMLElement;
    el.getBoundingClientRect = () => ({ top: 0, bottom: 20, height: 20, left: 0, right: 100, width: 100, x: 0, y: 0, toJSON: () => ({}) });
    return w.find(".wp-slider__track");
  }

  it("snap alone: the drag and the arrows land only on marks", async () => {
    const w = bound(Slider, { modelValue: 25, min: 0, max: 100, marks: MARKS, snap: true, ariaLabel: "Size" });
    const t = track(w);
    await point(t, "pointerdown", { clientX: 33 });
    expect(w.props("modelValue")).toBe(25);
    await point(t, "pointermove", { clientX: 80 });
    expect(w.props("modelValue")).toBe(100);
    await point(t, "pointerup", { clientX: 80 });
    const thumb = w.find("[role=slider]");
    await thumb.trigger("keydown", { key: "ArrowLeft" });
    expect(w.props("modelValue")).toBe(50);
    await thumb.trigger("keydown", { key: "ArrowLeft" });
    expect(w.props("modelValue")).toBe(25);
  });

  it("snap alone: a typed number goes to the nearest mark", async () => {
    const w = bound(Slider, { modelValue: 25, min: 0, max: 100, marks: MARKS, snap: true, withInput: true, ariaLabel: "Size" });
    const box = w.find("input");
    await box.setValue("60");
    await box.trigger("change");
    expect(w.props("modelValue")).toBe(50);
  });

  it(":snap=N pulls a drag onto a mark near one, and keys can still leave it", async () => {
    const w = bound(Slider, { modelValue: 10, min: 0, max: 100, marks: MARKS, snap: 4, ariaLabel: "Size" });
    const t = track(w);
    await point(t, "pointerdown", { clientX: 47 });
    expect(w.props("modelValue")).toBe(50);
    await point(t, "pointermove", { clientX: 40 });
    expect(w.props("modelValue")).toBe(40);
    await point(t, "pointermove", { clientX: 53 });
    expect(w.props("modelValue")).toBe(50);
    await point(t, "pointerup", { clientX: 53 });
    await w.find("[role=slider]").trigger("keydown", { key: "ArrowRight" });
    expect(w.props("modelValue")).toBe(51);
  });

  it("a pair snaps each end to marks and keeps them apart", async () => {
    const w = bound(Slider, { modelValue: [0, 100], min: 0, max: 100, marks: MARKS, snap: true, ariaLabel: "Range" });
    const [lo] = w.findAll("[role=slider]");
    await lo.trigger("keydown", { key: "ArrowRight" });
    expect(w.props("modelValue")).toEqual([25, 100]);
  });

  it("a pair with-input has a number box per end", () => {
    const w = bound(Slider, { modelValue: [1, 2], min: 0, max: 5, withInput: true, ariaLabel: "Weight" });
    expect(w.findAll("input").map((i: { attributes: (n: string) => string }) => i.attributes("aria-label"))).toEqual(["Weight, low end", "Weight, high end"]);
  });
});

describe("ResizeHandle and SplitPane", () => {
  it("moves with the arrows, clamps, jumps and resets", async () => {
    const w = bound(ResizeHandle, { modelValue: 300, min: 200, max: 400, defaultSize: 320, label: "Width" });
    const h = w.find("[role=separator]");
    expect(h.attributes("aria-valuenow")).toBe("300");
    await h.trigger("keydown", { key: "ArrowRight" });
    expect(w.props("modelValue")).toBe(316);
    await h.trigger("keydown", { key: "ArrowRight", shiftKey: true });
    expect(w.props("modelValue")).toBe(380);
    await h.trigger("keydown", { key: "End" });
    expect(w.props("modelValue")).toBe(400);
    await h.trigger("keydown", { key: "Home" });
    expect(w.props("modelValue")).toBe(200);
    await h.trigger("keydown", { key: "Enter" });
    expect(w.props("modelValue")).toBe(320);
  });

  it("reverse grows toward the start, and the pointer drags it", async () => {
    const w = bound(ResizeHandle, { modelValue: 300, reverse: true, label: "Chat width" });
    const h = w.find("[role=separator]");
    await h.trigger("keydown", { key: "ArrowLeft" });
    expect(w.props("modelValue")).toBe(316);
    await point(h, "pointerdown", { clientX: 500 });
    await point(h, "pointermove", { clientX: 450 });
    expect(w.props("modelValue")).toBe(366);
    await point(h, "pointerup", { clientX: 450 });
    expect(w.emitted("end")?.at(-1)).toEqual([366]);
  });

  it("split pane sizes the first panel and points the handle at it", () => {
    const w = mount(SplitPane, { props: { modelValue: 240, label: "List width" }, slots: { start: "L", end: "R" } });
    const start = w.find(".wp-split__start");
    expect(start.attributes("style")).toContain("width: 240px");
    expect(w.find("[role=separator]").attributes("aria-controls")).toBe(start.attributes("id"));
  });
});

describe("InlineEdit", () => {
  it("opens, saves on Enter and gives focus back", async () => {
    const w = bound(InlineEdit, { modelValue: "Hair", label: "Name" });
    expect(w.find("button").attributes("aria-label")).toBe("Rename Name: Hair");
    await w.find("button").trigger("click");
    const box = w.find("input");
    expect(document.activeElement).toBe(box.element);
    await box.setValue("  Hair colour ");
    await box.trigger("keydown", { key: "Enter" });
    expect(w.props("modelValue")).toBe("Hair colour");
    await nextTick();
    expect(document.activeElement).toBe(w.find("button").element);
  });

  it("Escape puts the old text back; an invalid value stays open with its message", async () => {
    const w = bound(InlineEdit, { modelValue: "Hair", label: "Name", validate: (v: string) => (v === "Pose" ? "Taken" : null) });
    await w.find("button").trigger("click");
    await w.find("input").setValue("Other");
    await w.find("input").trigger("keydown", { key: "Escape" });
    expect(w.props("modelValue")).toBe("Hair");
    expect(w.emitted("cancel")).toHaveLength(1);
    await w.find("button").trigger("keydown", { key: "F2" });
    await w.find("input").setValue("Pose");
    await w.find("input").trigger("keydown", { key: "Enter" });
    expect(w.find("[role=alert]").text()).toBe("Taken");
    expect(w.find("input").attributes("aria-invalid")).toBe("true");
    await w.find("input").setValue("");
    await w.find("input").trigger("keydown", { key: "Enter" });
    expect(w.find("[role=alert]").text()).toBe("Name can't be empty");
    expect(w.props("modelValue")).toBe("Hair");
  });
});

describe("TagInput", () => {
  it("adds on Enter and comma, refuses repeats and removes with Backspace", async () => {
    const w = bound(TagInput, { modelValue: ["warm"], ariaLabel: "Tags" });
    const box = w.find("input");
    await box.setValue("night");
    await box.trigger("keydown", { key: "Enter" });
    expect(w.props("modelValue")).toEqual(["warm", "night"]);
    await box.setValue("Warm");
    await box.trigger("keydown", { key: "," });
    expect(w.props("modelValue")).toEqual(["warm", "night"]);
    await nextTick();
    expect(w.find("[aria-live]").text()).toBe("Warm is already added");
    await box.setValue("");
    await box.trigger("keydown", { key: "Backspace" });
    expect(w.props("modelValue")).toEqual(["warm"]);
    await w.find('[aria-label="Remove warm"]').trigger("click");
    expect(w.props("modelValue")).toEqual([]);
  });

  it("splits typed and pasted lists, and keeps to the suggestions when asked", async () => {
    const w = bound(TagInput, { modelValue: [], suggestions: ["Season", "Time"], allowNew: false });
    const box = w.find("input");
    await box.setValue("season, mood, time,");
    expect(w.props("modelValue")).toEqual(["Season", "Time"]);
    const paste = new Event("paste") as Event & { clipboardData: { getData: () => string } };
    Object.assign(paste, { clipboardData: { getData: () => "x\ny" } });
    box.element.dispatchEvent(paste);
    expect(w.props("modelValue")).toEqual(["Season", "Time"]);
  });

  it("lights a suggestion with the arrows and takes it on Enter", async () => {
    const w = bound(TagInput, { modelValue: [], suggestions: ["warm", "cool", "pastel"] });
    const box = w.find("input");
    await box.trigger("focus");
    await box.setValue("o");
    expect(box.attributes("aria-expanded")).toBe("true");
    const opts = () => [...document.querySelectorAll("[role=option]")].map((o) => o.textContent);
    expect(opts()).toEqual(["cool"]);
    await box.trigger("keydown", { key: "ArrowDown" });
    expect(box.attributes("aria-activedescendant")).toBe(document.querySelector("[role=option]")?.id);
    await box.trigger("keydown", { key: "Enter" });
    expect(w.props("modelValue")).toEqual(["cool"]);
  });

  it("stops at max", async () => {
    const w = bound(TagInput, { modelValue: ["a"], max: 1 });
    expect(w.find("input").attributes("disabled")).toBeDefined();
  });
});

describe("DropZone", () => {
  function fileList(...files: File[]): DataTransfer {
    return { types: ["Files"], files, items: files.map((f) => ({ kind: "file", type: f.type })) } as unknown as DataTransfer;
  }
  /** jsdom has no DragEvent: a plain event carrying a fake dataTransfer. */
  async function drag(el: Element, type: string, dt: DataTransfer): Promise<void> {
    const ev = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(ev, "dataTransfer", { value: dt });
    el.dispatchEvent(ev);
    await nextTick();
  }

  it("splits dropped files into taken and refused", async () => {
    const w = mount(DropZone, { props: { accept: ".txt,image/*", maxSize: 10 } });
    const ok = new File(["abc"], "a.txt", { type: "text/plain" });
    const big = new File(["x".repeat(20)], "b.txt", { type: "text/plain" });
    const bad = new File(["x"], "c.pdf", { type: "application/pdf" });
    await drag(w.element, "drop", fileList(ok, big, bad));
    expect(w.emitted("files")?.[0][0]).toEqual([ok]);
    const rej = w.emitted("reject")?.[0][0] as { file: File; reason: string }[];
    expect(rej.map((r) => [r.file.name, r.reason])).toEqual([["b.txt", "Over 10 B"], ["c.pdf", "Not a file this takes"]]);
  });

  it("lights up for a file it takes, refuses one it doesn't, and takes one at a time", async () => {
    const w = mount(DropZone, { props: { accept: "image/*", hint: "images" } });
    await drag(w.element, "dragenter", fileList(new File([""], "a.png", { type: "image/png" })));
    expect(w.attributes("data-over")).toBe("ok");
    await drag(w.element, "dragleave", fileList());
    expect(w.attributes("data-over")).toBeUndefined();
    await drag(w.element, "dragenter", fileList(new File([""], "a.pdf", { type: "application/pdf" })));
    expect(w.attributes("data-over")).toBe("refuse");
    expect(w.text()).toContain("Only images");
    await drag(w.element, "dragleave", fileList());
    await drag(w.element, "dragenter", fileList(new File([""], "a.png", { type: "image/png" }), new File([""], "b.png", { type: "image/png" })));
    expect(w.text()).toContain("One file at a time");
  });

  it("overlay shows only while a file is over its content", async () => {
    const w = mount(DropZone, { props: { overlay: true }, slots: { default: "<p>chat</p>" } });
    expect(w.find(".wp-drop--overlay").exists()).toBe(false);
    await drag(w.element, "dragenter", fileList(new File([""], "a.png", { type: "image/png" })));
    expect(w.find(".wp-drop--overlay").exists()).toBe(true);
    expect(w.text()).toContain("chat");
  });
});

describe("SortableList", () => {
  type Row = { id: string; name: string };
  const rows: Row[] = [{ id: "a", name: "Alpha" }, { id: "b", name: "Beta" }, { id: "c", name: "Gamma" }];
  const opts = { itemKey: (r: Row) => r.id, itemLabel: (r: Row) => r.name, label: "Rules" };
  const names = (w: { props: (k: string) => unknown }) => (w.props("modelValue") as Row[]).map((r) => r.name);

  it("picks up, moves and drops from the keyboard", async () => {
    const w = bound(SortableList, { modelValue: rows, ...opts }, { slots: { item: "<span>{{ params.item.name }}</span>" } });
    const grip = () => w.findAll(".wp-sortable__grip");
    expect(grip()[0].attributes("aria-label")).toBe("Move Alpha");
    await grip()[0].trigger("keydown", { key: " " });
    expect(grip()[0].attributes("aria-pressed")).toBe("true");
    await grip()[0].trigger("keydown", { key: "ArrowDown" });
    expect(names(w)).toEqual(["Beta", "Alpha", "Gamma"]);
    await grip()[1].trigger("keydown", { key: "End" });
    expect(names(w)).toEqual(["Beta", "Gamma", "Alpha"]);
    await grip()[2].trigger("keydown", { key: "Enter" });
    expect(grip()[2].attributes("aria-pressed")).toBe("false");
    await nextTick();
    expect(w.find("[aria-live]").text()).toBe("Alpha dropped at 3 of 3");
  });

  it("Escape puts the order back; Alt+arrow moves one step", async () => {
    const w = bound(SortableList, { modelValue: rows, ...opts });
    const grip = () => w.findAll(".wp-sortable__grip");
    await grip()[0].trigger("keydown", { key: "Enter" });
    await grip()[0].trigger("keydown", { key: "ArrowDown" });
    await grip()[1].trigger("keydown", { key: "Escape" });
    expect(names(w)).toEqual(["Alpha", "Beta", "Gamma"]);
    await grip()[2].trigger("keydown", { key: "ArrowUp", altKey: true });
    expect(names(w)).toEqual(["Alpha", "Gamma", "Beta"]);
    expect(w.emitted("move")?.at(-1)).toEqual([{ from: 2, to: 1 }]);
  });

  /** jsdom has no DragEvent: a plain event with clientY and a fake dataTransfer. */
  async function dnd(el: Element, type: string, clientY = 0): Promise<Event> {
    const ev = new Event(type, { bubbles: true, cancelable: true });
    const dt = { setData: () => undefined, effectAllowed: "", dropEffect: "" };
    Object.defineProperty(ev, "dataTransfer", { value: dt });
    Object.defineProperty(ev, "clientY", { value: clientY });
    el.dispatchEvent(ev);
    await nextTick();
    return ev;
  }
  function boxes(w: { findAll: (s: string) => { element: Element }[] }): void {
    w.findAll(".wp-sortable__row").forEach((li, i) => {
      li.element.getBoundingClientRect = () => ({ top: i * 20, bottom: i * 20 + 20, height: 20, left: 0, right: 100, width: 100, x: 0, y: i * 20, toJSON: () => ({}) });
    });
  }

  it("drags from the grip: the target opens a gap and the drop moves the row", async () => {
    const w = bound(SortableList, { modelValue: rows, ...opts });
    boxes(w);
    const li = () => w.findAll(".wp-sortable__row");
    await point(w.findAll(".wp-sortable__grip")[0], "pointerdown", { clientY: 10 });
    expect(li()[0].attributes("draggable")).toBe("true");
    await dnd(li()[0].element, "dragstart");
    expect(li()[0].classes()).toContain("wp-rowdrag--dragging");
    const over = await dnd(w.find("ul").element, "dragover", 55);
    expect(over.defaultPrevented).toBe(true);
    expect(li()[2].classes()).toContain("wp-rowdrag--after");
    await dnd(w.find("ul").element, "drop", 55);
    expect(names(w)).toEqual(["Beta", "Gamma", "Alpha"]);
    expect(w.emitted("drop")?.at(-1)).toEqual([{ from: 0, over: 2, edge: "after", to: 2 }]);
    expect(li()[2].classes()).not.toContain("wp-rowdrag--dragging");
  });

  it("starts no drag outside the grip and shows no line for a drop that changes nothing", async () => {
    const w = bound(SortableList, { modelValue: rows, ...opts });
    boxes(w);
    const li = () => w.findAll(".wp-sortable__row");
    const ev = await dnd(li()[1].element, "dragstart");
    expect(ev.defaultPrevented).toBe(true);
    await point(w.findAll(".wp-sortable__grip")[1], "pointerdown", { clientY: 30 });
    await dnd(li()[1].element, "dragstart");
    await dnd(w.find("ul").element, "dragover", 5);
    expect(li()[0].classes()).toContain("wp-rowdrag--before");
    // After Alpha, or on Beta itself, is where Beta already is: no line.
    await dnd(w.find("ul").element, "dragover", 15);
    expect(w.findAll(".wp-rowdrag--before, .wp-rowdrag--after, .wp-rowdrag--end")).toHaveLength(0);
    await dnd(w.find("ul").element, "dragover", 25);
    expect(w.findAll(".wp-rowdrag--before, .wp-rowdrag--after, .wp-rowdrag--end")).toHaveLength(0);
    await dnd(li()[1].element, "dragend");
    expect(li()[1].classes()).not.toContain("wp-rowdrag--dragging");
  });

  it("lets drop-line allow a same-place drop, style its line and refuse others", async () => {
    const dropLine = (t: { over: number; edge: string }, noOp: boolean) =>
      t.edge === "end" ? { inset: 12, color: "red" } : t.over === 0 ? false : noOp ? undefined : true;
    const w = bound(SortableList, { modelValue: rows, ...opts, dropLine, endZone: true });
    boxes(w);
    const li = () => w.findAll(".wp-sortable__row");
    await point(w.findAll(".wp-sortable__grip")[2], "pointerdown", { clientY: 50 });
    await dnd(li()[2].element, "dragstart");
    expect(w.find(".wp-sortable").attributes("data-end-zone")).toBe("true");
    await dnd(w.find("ul").element, "dragover", 5);
    expect(w.findAll(".wp-rowdrag--before")).toHaveLength(0);
    await dnd(w.find("ul").element, "dragover", 70);
    expect(li()[2].classes()).toContain("wp-rowdrag--end");
    expect(li()[2].attributes("style")).toContain("--wp-rowdrag-inset: 12px");
    await dnd(w.find("ul").element, "drop", 70);
    expect(w.emitted("drop")?.at(-1)).toEqual([{ from: 2, over: 2, edge: "end", to: 2 }]);
    expect(w.emitted("move")).toBeUndefined();
  });
});

describe("useRowDrag", () => {
  it("takes a foreign drag it recognises and finds its target over the whole list", async () => {
    const { useRowDrag } = await import("./row-drag");
    const list = document.createElement("div");
    for (const k of ["a", "b"]) {
      const el = document.createElement("div");
      el.dataset.dragKey = k;
      const i = k === "a" ? 0 : 1;
      el.getBoundingClientRect = () => ({ top: i * 20, bottom: i * 20 + 20, height: 20, left: 0, right: 10, width: 10, x: 0, y: 0, toJSON: () => ({}) });
      list.appendChild(el);
    }
    const dropped: unknown[] = [];
    const drag = useRowDrag({ list: { value: list } as never, foreign: () => "x", onDrop: (from, t) => dropped.push([from, t]) });
    const ev = (type: string, y: number) => {
      const e = new Event(type, { cancelable: true });
      Object.defineProperty(e, "clientY", { value: y });
      return e as DragEvent;
    };
    drag.over(ev("dragover", 35));
    expect(drag.classes("b")["wp-rowdrag--after"]).toBe(true);
    drag.drop(ev("drop", 35));
    expect(dropped).toEqual([["x", { key: "b", index: 1, edge: "after" }]]);
    expect(drag.target.value).toBeNull();
  });

  it("leaves a drag alone when it isn't ours", async () => {
    const { useRowDrag } = await import("./row-drag");
    const drag = useRowDrag({ list: { value: document.createElement("div") } as never, onDrop: () => undefined });
    const e = new Event("dragover", { cancelable: true }) as DragEvent;
    drag.over(e);
    expect(e.defaultPrevented).toBe(false);
  });
});

describe("useRowDrag locate", () => {
  it("uses the consumer's own hit test", async () => {
    const { useRowDrag } = await import("./row-drag");
    const drag = useRowDrag({
      list: { value: document.createElement("div") } as never,
      foreign: () => "x",
      locate: () => ({ key: "frame-1", index: 0, edge: "end" }),
      accept: () => ({ inset: 16 }),
      onDrop: () => undefined,
    });
    drag.over(new Event("dragover", { cancelable: true }) as DragEvent);
    expect(drag.target.value).toMatchObject({ key: "frame-1", edge: "end", line: { inset: 16 } });
    expect(drag.lineStyle("frame-1")).toEqual({ "--wp-rowdrag-inset": "16px" });
  });
});
