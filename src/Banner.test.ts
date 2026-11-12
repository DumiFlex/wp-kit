import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Banner from "./Banner.vue";

describe("Banner animate", () => {
  it("marks the banner for its entrance only when asked", () => {
    expect(mount(Banner, { props: { animate: true }, slots: { default: "Hi" } }).find(".wp-banner").attributes("data-animate")).toBe("true");
    expect(mount(Banner, { slots: { default: "Hi" } }).find(".wp-banner").attributes("data-animate")).toBeUndefined();
  });
});

describe("motion.css wp-flash", () => {
  const css = readFileSync(resolve(__dirname, "motion.css"), "utf8");
  it("defines the class, its keyframes and stops for reduced motion", () => {
    expect(css).toMatch(/\.wp-flash \{ animation: wp-flash /);
    expect(css).toMatch(/@keyframes wp-flash/);
    expect(css).toMatch(/\.wp-attention, \.wp-flash \{ animation: none; \}/);
  });
});
