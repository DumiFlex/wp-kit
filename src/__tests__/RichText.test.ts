import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import RichText from "../RichText.vue";

describe("RichText", () => {
  it("renders a link, a code chip, and the plain text between them", () => {
    const wrap = mount(RichText, {
      props: { text: "go to https://example.com/x then use @{color}" },
    });

    // URL → <a href> opening in a new tab safely.
    const a = wrap.find("a");
    expect(a.exists()).toBe(true);
    expect(a.attributes("href")).toBe("https://example.com/x");
    expect(a.attributes("target")).toBe("_blank");
    expect(a.attributes("rel")).toBe("noopener noreferrer");
    expect(a.text()).toBe("https://example.com/x");

    // Grammar token → <code>.
    const code = wrap.find("code");
    expect(code.exists()).toBe(true);
    expect(code.text()).toBe("@{color}");

    // Plain text survives intact between the rich nodes.
    expect(wrap.text()).toContain("go to");
    expect(wrap.text()).toContain("then use");

    wrap.unmount();
  });

  it("renders pure prose with no anchors or code chips", () => {
    const wrap = mount(RichText, { props: { text: "nothing special here" } });
    expect(wrap.find("a").exists()).toBe(false);
    expect(wrap.find("code").exists()).toBe(false);
    expect(wrap.text()).toBe("nothing special here");
    wrap.unmount();
  });
});
