import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import Popover from "../Popover.vue";
import Select from "../Select.vue";

const opts = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

function must<T>(v: T | null | undefined): T {
  if (v == null) throw new Error("missing");
  return v;
}

// A Popover holding a Select: the Select's list floats on <body>, outside
// the Popover's panel, and must still count as inside it.
const Host = defineComponent({
  setup() {
    const open = ref(true);
    const pick = ref<string | number | null>(null);
    return () => h(Popover, {
      open: open.value,
      label: "Panel",
      "onUpdate:open": (v: boolean) => { open.value = v; },
    }, {
      trigger: ({ props }: { props: Record<string, unknown> }) => h("button", { ...props, "data-test": "trigger" }, "Open"),
      default: () => h(Select, {
        modelValue: pick.value,
        options: opts,
        "onUpdate:modelValue": (v: string | number | null) => { pick.value = v; },
      }),
    });
  },
});

describe("floating layer", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  async function openSelect(): Promise<ReturnType<typeof mount>> {
    const w = mount(Host, { attachTo: document.body });
    await nextTick();
    await nextTick();
    must(document.querySelector<HTMLElement>("[data-test='select-trigger']")).click();
    await nextTick();
    expect(document.querySelector(".wp-select__menu")).not.toBeNull();
    return w;
  }

  it("keeps the Popover open on a click in a Select list opened from it", async () => {
    const w = await openSelect();
    const option = must(document.querySelector<HTMLElement>(".wp-select__option"));
    option.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await nextTick();
    expect(document.querySelector(".wp-popover")).not.toBeNull();
    w.unmount();
  });

  it("lets Escape shut the Select list first, then the Popover", async () => {
    const w = await openSelect();
    const trigger = must(document.querySelector<HTMLElement>("[data-test='select-trigger']"));
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await nextTick();
    expect(document.querySelector(".wp-select__menu")).toBeNull();
    expect(document.querySelector(".wp-popover")).not.toBeNull();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await nextTick();
    expect(document.querySelector(".wp-popover")).toBeNull();
    w.unmount();
  });

  it("still closes on a click outside both", async () => {
    const w = await openSelect();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await nextTick();
    expect(document.querySelector(".wp-popover")).toBeNull();
    w.unmount();
  });
});
