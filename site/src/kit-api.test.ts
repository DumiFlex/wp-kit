import KIT_API from "virtual:kit-api";
import { mount } from "@vue/test-utils";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import KitEntry from "./KitEntry.vue";
import { searchItems } from "./search";

describe("kit API tables", () => {
  it("reads every component in src/", () => {
    const vue = readdirSync(resolve(process.cwd(), "src")).filter((f) => f.endsWith(".vue")).map((f) => `src/${f}`);
    expect(Object.keys(KIT_API).sort()).toEqual(vue.sort());
  });

  it("gives props their type, default and comment, without the undefined every optional prop has", () => {
    const tone = KIT_API["src/Chip.vue"]?.props.find((p) => p.name === "tone");
    expect(tone).toMatchObject({ default: '"default"', required: false });
    expect(tone?.type).not.toMatch(/undefined/);
    const dot = KIT_API["src/Chip.vue"]?.props.find((p) => p.name === "dot");
    expect(dot?.description).toMatch(/status dot/);
  });

  it("lists events, slots and only what defineExpose exposes", () => {
    expect(KIT_API["src/Slider.vue"]?.events.map((e) => e.name)).toContain("update:modelValue");
    expect(KIT_API["src/Chip.vue"]?.slots.map((s) => s.name)).toContain("default");
    expect(KIT_API["src/Chip.vue"]?.exposed).toEqual([]);
    expect(KIT_API["src/WpNumber.vue"]?.exposed.map((x) => x.name)).toEqual(expect.arrayContaining(["focus", "select"]));
  });

  it("folds the tables under the piece, opening on click", async () => {
    const w = mount(KitEntry, { props: { id: "chip" } });
    const api = w.find('[data-test="kit-api"]');
    expect(api.exists()).toBe(true);
    expect(api.text()).toMatch(/\d+ props/);
    expect(w.find('[data-prop="tone"]').exists()).toBe(false);
    await api.find("button").trigger("click");
    expect(w.find('[data-prop="tone"]').exists()).toBe(true);
  });

  it("lets the search find a piece by a prop name", () => {
    const hit = searchItems().find((i) => i.target === "kit-date-picker");
    expect(hit?.keys).toMatch(/\bclearable\b/);
  });
});
