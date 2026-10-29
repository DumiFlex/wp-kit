import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { mount } from "@vue/test-utils";
import App from "./App.vue";
import { KIT_ENTRIES, KIT_EXAMPLES, KIT_EXEMPT, KIT_GROUPS } from "./registry";

// Vitest runs from the repo root (and import.meta.url is not a file: URL under jsdom).
const SRC = resolve(process.cwd(), "src");
const DEMOS = resolve(process.cwd(), "site/src/demos");

const pieces = readdirSync(SRC)
  .filter((f) => f.endsWith(".vue"))
  .map((f) => `src/${f}`);
const demos = readdirSync(DEMOS)
  .filter((f) => f.endsWith(".vue"))
  .map((f) => f.slice(0, -".vue".length));
const ids = new Set(KIT_ENTRIES.map((e) => e.id));

describe("kit site coverage", () => {
  it("lists every piece in src/ or exempts it", () => {
    const listed = new Set(KIT_ENTRIES.map((e) => e.file));
    const missing = pieces.filter((p) => !listed.has(p) && !(p in KIT_EXEMPT));
    expect(missing).toEqual([]);
  });

  it("points every entry at a file that exists", () => {
    const files = new Set([...pieces, ...readdirSync(SRC).map((f) => `src/${f}`), ...readdirSync(`${SRC}/theme`).map((f) => `src/theme/${f}`)]);
    expect(KIT_ENTRIES.filter((e) => !files.has(e.file)).map((e) => e.file)).toEqual([]);
  });

  it("gives every entry a demo and every demo an entry", () => {
    expect(KIT_ENTRIES.filter((e) => !demos.includes(e.id)).map((e) => e.id)).toEqual([]);
    expect(demos.filter((d) => !ids.has(d))).toEqual([]);
  });

  it("keeps ids unique, groups known and examples on real entries", () => {
    expect(ids.size).toBe(KIT_ENTRIES.length);
    const groups = new Set(KIT_GROUPS.map((g) => g.id));
    expect(KIT_ENTRIES.filter((e) => !groups.has(e.group)).map((e) => e.id)).toEqual([]);
    expect(Object.keys(KIT_EXAMPLES).filter((k) => !ids.has(k))).toEqual([]);
  });
});

describe("kit site", () => {
  it("draws every entry with its demo", () => {
    const wrapper = mount(App, { attachTo: document.body });
    for (const e of KIT_ENTRIES) {
      expect(wrapper.find(`[data-kit-entry="${e.id}"]`).exists(), e.id).toBe(true);
    }
    wrapper.unmount();
  });

  it("puts the palette, look and scheme on <html>", async () => {
    const wrapper = mount(App, { attachTo: document.body });
    const root = document.documentElement;
    await wrapper.find('[data-test="site-scheme-light"]').trigger("click");
    expect(root.classList.contains("wp-theme-light")).toBe(true);
    await wrapper.find('[data-test="site-look"] select, select[data-test="site-look"]').setValue("tui");
    expect(root.getAttribute("data-wp-look")).toBe("tui");
    await wrapper.find('[data-test="site-palette"] select, select[data-test="site-palette"]').setValue("ember");
    expect(root.getAttribute("data-wp-palette")).toBe("ember");
    wrapper.unmount();
  });
});
