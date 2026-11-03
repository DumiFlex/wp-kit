import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SettingGroup from "../SettingGroup.vue";
import SettingRow from "../SettingRow.vue";

describe("SettingGroup + SettingRow", () => {
  it("draws a titled panel of rows, each label with its control", () => {
    const w = mount(SettingGroup, {
      props: { title: "Content", note: "Saved here." },
      slots: { default: '<div class="r1">one</div>' },
    });
    expect(w.find(".wp-set-group__title").text()).toBe("Content");
    expect(w.find(".wp-set-group__note").text()).toBe("Saved here.");
    expect(w.find(".wp-set-group__panel .r1").exists()).toBe(true);
  });

  it("names the control with a real label, and says the recommended pick", () => {
    const w = mount(SettingRow, {
      props: { label: "Compact", hint: "Tighter rows.", for: "c", recommended: "On", settingKey: "density" },
      slots: { default: '<input id="c" />' },
    });
    expect(w.find("label").attributes("for")).toBe("c");
    expect(w.find(".wp-set-row__hint").text()).toBe("Tighter rows.");
    expect(w.find('[data-test="setting-recommended"]').text()).toBe("Recommended: On");
    expect(w.attributes("id")).toBe("density");
    expect(w.attributes("data-setting")).toBe("density");
  });

  it("flashes when highlighted, and lays out stacked or as a form", async () => {
    const w = mount(SettingRow, { props: { label: "Path" } });
    expect(w.find("label").exists()).toBe(false);
    expect(w.classes()).not.toContain("wp-set-row--target");
    await w.setProps({ highlighted: true, stacked: true });
    expect(w.classes()).toEqual(expect.arrayContaining(["wp-set-row--target", "wp-set-row--stacked"]));
    await w.setProps({ form: true });
    expect(w.classes()).toContain("wp-set-row--form");
  });
});
