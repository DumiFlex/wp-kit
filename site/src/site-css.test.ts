import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The kit theme pins html/body/#app to the window with overflow hidden for the
// manager, which scrolls inside its own panes. The site is a page the window
// scrolls, so its own sheet must let them grow again.
describe("site sheet", () => {
  const css = readFileSync("site/src/site.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

  it("lets the window scroll the page", () => {
    const rule = /html,\s*body,\s*#app\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(rule).toMatch(/overflow:\s*visible/);
    expect(rule).toMatch(/height:\s*auto/);
  });

  it("pads its page, since no app shell does", () => {
    const rule = /\.wp-site \.wp-page\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(rule).toMatch(/padding:/);
  });
});
