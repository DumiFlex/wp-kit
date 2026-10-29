import { applyAppearance, loadAppearance, saveAppearance } from "./appearance";

describe("site appearance", () => {
  beforeEach(() => localStorage.clear());

  it("falls back field by field on a bad saved value", () => {
    localStorage.setItem("wp-kit-site.appearance", JSON.stringify({ palette: "nope", look: "crisp", scheme: 3 }));
    expect(loadAppearance()).toEqual({ palette: "orbit", look: "crisp", scheme: "system" });
    localStorage.setItem("wp-kit-site.appearance", "{not json");
    expect(loadAppearance()).toEqual({ palette: "orbit", look: "orbit", scheme: "system" });
  });

  it("round-trips a saved choice", () => {
    saveAppearance({ palette: "tide", look: "soft", scheme: "light" });
    expect(loadAppearance()).toEqual({ palette: "tide", look: "soft", scheme: "light" });
  });

  it("sets no attribute for the Orbit defaults", () => {
    const root = document.createElement("html");
    applyAppearance({ palette: "nebula", look: "terminal", scheme: "dark" }, root);
    expect(root.getAttribute("data-wp-palette")).toBe("nebula");
    expect(root.getAttribute("data-wp-look")).toBe("terminal");
    expect(root.classList.contains("wp-theme-light")).toBe(false);
    applyAppearance({ palette: "orbit", look: "orbit", scheme: "light" }, root);
    expect(root.hasAttribute("data-wp-palette")).toBe(false);
    expect(root.hasAttribute("data-wp-look")).toBe(false);
    expect(root.classList.contains("wp-theme-light")).toBe(true);
    expect(root.classList.contains("wp-manager")).toBe(true);
  });
});
