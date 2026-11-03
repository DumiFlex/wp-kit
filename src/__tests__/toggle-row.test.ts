import { mount } from "@vue/test-utils";
import { defineComponent, ref } from "vue";
import { describe, expect, it } from "vitest";
import Checkbox from "../Checkbox.vue";
import SettingRow from "../SettingRow.vue";
import WpSwitch from "../WpSwitch.vue";
import { vToggleRow } from "../toggle-row";

function row(template: string, setup: () => Record<string, unknown> = () => ({ on: ref(false) })) {
  return mount(defineComponent({ components: { Checkbox, WpSwitch, SettingRow }, directives: { toggleRow: vToggleRow }, setup, template }), {
    attachTo: document.body,
  });
}

describe("v-toggle-row", () => {
  it("flips the row's one switch on a click on its words, and focuses it", async () => {
    const w = row('<div v-toggle-row class="r"><span class="words">Override seed</span><WpSwitch v-model="on" aria-label="Override seed" /></div>');
    expect(w.find(".r").classes()).toContain("wp-toggle-row");
    await w.find(".words").trigger("click");
    expect(w.find('[role="switch"]').attributes("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(w.find('[role="switch"]').element);
    await w.find(".r").trigger("click");
    expect(w.find('[role="switch"]').attributes("aria-checked")).toBe("false");
    w.unmount();
  });

  it("flips a box-only Checkbox once, and a click on the box itself stays one flip", async () => {
    const w = row('<span v-toggle-row class="r"><Checkbox v-model="on" size="sm" aria-label="Invert" /><span class="words">Invert</span></span>');
    await w.find(".words").trigger("click");
    expect(w.find('[role="checkbox"]').attributes("aria-checked")).toBe("true");
    await w.find('[role="checkbox"]').trigger("click");
    expect(w.find('[role="checkbox"]').attributes("aria-checked")).toBe("false");
    w.unmount();
  });

  it("leaves a labelled Checkbox's own label click to it (no double flip)", async () => {
    const w = row('<div v-toggle-row><Checkbox v-model="on" label="Show" /></div>');
    await w.find(".wp-checkbox__label").trigger("click");
    expect(w.find('[role="checkbox"]').attributes("aria-checked")).toBe("true");
    w.unmount();
  });

  it("does nothing with two toggles, another control, a button, or a disabled toggle", async () => {
    const two = row('<div v-toggle-row class="r"><span class="words">Both</span><WpSwitch v-model="on" aria-label="a" /><WpSwitch aria-label="b" /></div>');
    expect(two.find(".r").classes()).not.toContain("wp-toggle-row");
    await two.find(".words").trigger("click");
    expect(two.findAll('[role="switch"]')[0]?.attributes("aria-checked")).toBe("false");
    two.unmount();

    const field = row('<div v-toggle-row class="r"><span class="words">Limit</span><WpSwitch v-model="on" aria-label="a" /><input type="number" /></div>');
    await field.find(".words").trigger("click");
    expect(field.find('[role="switch"]').attributes("aria-checked")).toBe("false");
    field.unmount();

    const btn = row('<div v-toggle-row><button class="b" type="button">Open</button><WpSwitch v-model="on" aria-label="a" /></div>');
    await btn.find(".b").trigger("click");
    expect(btn.find('[role="switch"]').attributes("aria-checked")).toBe("false");
    btn.unmount();

    const off = row('<div v-toggle-row class="r"><span class="words">Locked</span><WpSwitch v-model="on" disabled aria-label="a" /></div>');
    expect(off.find(".r").classes()).toContain("wp-toggle-row--disabled");
    await off.find(".words").trigger("click");
    expect(off.find('[role="switch"]').attributes("aria-checked")).toBe("false");
    off.unmount();
  });

  it("turns off with v-toggle-row=\"false\"", async () => {
    const w = row('<div v-toggle-row="false" class="r"><span class="words">Words</span><WpSwitch v-model="on" aria-label="a" /></div>');
    await w.find(".words").trigger("click");
    expect(w.find('[role="switch"]').attributes("aria-checked")).toBe("false");
    w.unmount();
  });

  it("makes a SettingRow's label and hint flip its switch, nested rows flip once", async () => {
    const w = row(
      '<div v-toggle-row><SettingRow label="Debug log" hint="Writes every call."><WpSwitch v-model="on" size="md" aria-label="Debug log" /></SettingRow></div>',
    );
    await w.find(".wp-set-row__label").trigger("click");
    expect(w.find('[role="switch"]').attributes("aria-checked")).toBe("true");
    await w.find(".wp-set-row__hint").trigger("click");
    expect(w.find('[role="switch"]').attributes("aria-checked")).toBe("false");
    w.unmount();
  });
});
