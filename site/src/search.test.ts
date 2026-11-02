import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import SiteSearch from "./SiteSearch.vue";
import { KIT_ENTRIES, KIT_GROUPS } from "./registry";
import { mark, search, searchItems, snippet } from "./search";

const ITEMS = searchItems();
const targets = (q: string): string[] => search(q, ITEMS).map((r) => r.item.target);

describe("site search", () => {
  it("finds every piece, every group and the Tokens and Animations sections", () => {
    const all = new Set(ITEMS.map((i) => i.target));
    for (const e of KIT_ENTRIES) expect(all.has(`kit-${e.id}`)).toBe(true);
    for (const g of KIT_GROUPS) expect(all.has(`kit-group-${g.id}`)).toBe(true);
    expect(all.has("kit-tokens")).toBe(true);
    expect(all.has("kit-motion")).toBe(true);
  });

  it("puts a name match first", () => {
    expect(targets("button")[0]).toBe("kit-button");
    expect(targets("Popover")[0]).toBe("kit-popover");
    expect(targets("anim")[0]).toBe("kit-motion");
  });

  it("finds a piece by its file or by what it is for", () => {
    expect(targets("src/WpNumber.vue")).toContain("kit-wp-number");
    expect(targets("clipboard")).toContain("kit-copy-button");
  });

  it("needs every word to match", () => {
    expect(targets("copy clipboard")).toContain("kit-copy-button");
    expect(targets("copy zzqx")).toEqual([]);
  });

  it("finds nothing for an empty query", () => {
    expect(search("   ", ITEMS)).toEqual([]);
  });

  it("marks the matched parts of a name", () => {
    expect(mark("CopyButton", ["button"])).toEqual([{ text: "Copy", hit: false }, { text: "Button", hit: true }]);
  });

  it("cuts a long text near the first match", () => {
    const body = `${"a ".repeat(120)}needle and more after it`;
    const s = snippet(body, ["needle"]);
    expect(s.startsWith("…")).toBe(true);
    expect(s).toContain("needle");
    expect(snippet("short", [])).toBe("short");
  });
});

describe("SiteSearch", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it("lists matches, moves with the arrows and jumps on Enter", async () => {
    const target = document.createElement("article");
    target.id = "kit-copy-button";
    document.body.append(target);
    const w = mount(SiteSearch, { attachTo: document.body });
    const input = w.get("[data-test='site-search']");
    await input.trigger("focus");
    await input.setValue("copy");
    await nextTick();
    const opts = document.querySelectorAll("[role='option']");
    expect(opts.length).toBeGreaterThan(0);
    expect(input.attributes("aria-expanded")).toBe("true");
    expect(input.attributes("aria-activedescendant")).toBe(opts[0]?.id);

    await input.trigger("keydown", { key: "ArrowDown" });
    expect(input.attributes("aria-activedescendant")).toBe(opts[1]?.id ?? opts[0]?.id);
    await input.trigger("keydown", { key: "ArrowUp" });

    const first = search("copy", searchItems())[0];
    expect(first?.item.target).toBe("kit-copy-button");
    await input.trigger("keydown", { key: "Enter" });
    expect(location.hash).toBe("#kit-copy-button");
    expect(document.activeElement).toBe(target);
    expect((input.element as HTMLInputElement).value).toBe("");
    w.unmount();
  });

  it("says when nothing matches", async () => {
    const w = mount(SiteSearch, { attachTo: document.body });
    const input = w.get("[data-test='site-search']");
    await input.trigger("focus");
    await input.setValue("zzqx");
    await nextTick();
    expect(document.querySelector("[data-test='site-search-empty']")?.textContent).toContain("zzqx");
    w.unmount();
  });

  it("focuses the box on / and Mod+K", async () => {
    const w = mount(SiteSearch, { attachTo: document.body });
    const input = w.get("[data-test='site-search']").element;
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "/" }));
    expect(document.activeElement).toBe(input);
    (input as HTMLInputElement).blur();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
    expect(document.activeElement).toBe(input);
    w.unmount();
  });
});
