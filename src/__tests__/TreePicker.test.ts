import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";
import TreePicker from "../TreePicker.vue";
import { flattenTree, pickedUnder, searchTree, togglePick, type TreePickerNode } from "../tree-picker";

const tree: TreePickerNode[] = [
  { id: "style", label: "Style" },
  {
    id: "character", label: " Character", children: [
      { id: "hair", label: "Hair", children: [{ id: "hair-colour", label: "Colour" }] },
      { id: "eyes", label: "Eyes" },
    ],
  },
  { id: "scene", label: "Scene", children: [{ id: "lighting", label: "Lighting" }, { id: "cafe", label: "Café" }] },
];

function must<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw new Error("missing");
  return v;
}

describe("tree-picker helpers", () => {
  it("flattens parents first with trimmed path labels", () => {
    expect(flattenTree(tree).map((r) => [r.id, r.path.join("/")])).toEqual([
      ["style", ""], ["character", ""], ["hair", "Character"], ["hair-colour", "Character/Hair"],
      ["eyes", "Character"], ["scene", ""], ["lighting", "Scene"], ["cafe", "Scene"],
    ]);
  });

  it("searches labels and paths, own-label matches first, ignoring accents", () => {
    const rows = flattenTree(tree);
    expect(searchTree(rows, "hair").map((r) => r.id)).toEqual(["hair", "hair-colour"]);
    expect(searchTree(rows, "character colour").map((r) => r.id)).toEqual(["hair-colour"]);
    expect(searchTree(rows, "cafe").map((r) => r.id)).toEqual(["cafe"]);
    expect(searchTree(rows, "  ")).toHaveLength(rows.length);
  });

  it("counts picks under a node and toggles within max", () => {
    expect(pickedUnder(must(tree[1]), new Set(["character", "hair-colour", "lighting"]))).toBe(2);
    expect(togglePick(["a"], "b", 2)).toEqual(["a", "b"]);
    expect(togglePick(["a", "b"], "c", 2)).toEqual(["a", "b"]);
    expect(togglePick(["a", "b"], "a", 2)).toEqual(["b"]);
  });
});

describe("TreePicker.vue", () => {
  function mountIt(value: string[], max = 20) {
    const w = mount(TreePicker, {
      props: { items: tree, modelValue: value, max, noun: "categories", "onUpdate:modelValue": (v: string[]) => w.setProps({ modelValue: v }) },
    });
    return w;
  }

  it("shows picks as chips with their path and the count", () => {
    const w = mountIt(["hair-colour"], 5);
    const picked = w.get('[data-test="tree-picker-picked"]');
    expect(picked.text()).toContain("1 of 5");
    expect(picked.text()).toContain("Character › Hair ›");
  });

  it("opens groups that hold a pick and counts them", () => {
    const w = mountIt(["hair-colour"]);
    const char = w.get('[data-test="tree-picker-group-character"]');
    expect(char.attributes("aria-expanded")).toBe("true");
    expect(char.text()).toContain("1");
    expect(w.get('[data-test="tree-picker-group-scene"]').attributes("aria-expanded")).toBe("false");
  });

  it("toggles a chip on and removes a pick", async () => {
    const w = mountIt([]);
    await w.get('[data-test="tree-picker-group-scene"]').trigger("click");
    await w.get('.wp-tree-picker__groups [data-id="lighting"]').trigger("click");
    expect(w.props("modelValue")).toEqual(["lighting"]);
    await w.get('[data-test="tree-picker-picked"] .wp-chip__close').trigger("click");
    expect(w.props("modelValue")).toEqual([]);
  });

  it("lists matches while searching", async () => {
    const w = mountIt([]);
    await w.get('input[data-test="tree-picker-search"]').setValue("hair");
    await nextTick();
    const ids = w.findAll('[data-test="tree-picker-matches"] [data-id]').map((c) => c.attributes("data-id"));
    expect(ids).toEqual(["hair", "hair-colour"]);
    expect(w.find(".wp-tree-picker__groups").exists()).toBe(false);
    await w.get('input[data-test="tree-picker-search"]').setValue("zzz");
    expect(w.get('[data-test="tree-picker-matches"]').text()).toContain("No categories match");
  });

  it("disables unpicked chips at max", () => {
    const w = mountIt(["style"], 1);
    const scene = w.findAll('.wp-tree-picker__groups [data-id="lighting"]');
    expect(must(scene[0]).attributes("disabled")).toBeDefined();
  });
});
