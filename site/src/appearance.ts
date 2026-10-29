/**
 * The site's palette, look and light/dark. They go on <html> the same way the
 * extension's manager puts them there (`data-wp-palette`, `data-wp-look`,
 * `wp-theme-light`), so every piece shows here as it shows in the app.
 */

export const PALETTES = [
  { value: "orbit", label: "Orbit" },
  { value: "native", label: "Native" },
  { value: "nebula", label: "Nebula" },
  { value: "tide", label: "Tide" },
  { value: "ember", label: "Ember" },
  { value: "community", label: "Community" },
  { value: "contrast", label: "Contrast" },
] as const;

export const LOOKS = [
  { value: "orbit", label: "Orbit" },
  { value: "crisp", label: "Crisp" },
  { value: "soft", label: "Soft" },
  { value: "terminal", label: "Terminal" },
  { value: "editorial", label: "Editorial" },
  { value: "compact", label: "Compact" },
  { value: "tui", label: "TUI" },
] as const;

export type Palette = (typeof PALETTES)[number]["value"];
export type Look = (typeof LOOKS)[number]["value"];
export type Scheme = "system" | "dark" | "light";

export interface Appearance {
  palette: Palette;
  look: Look;
  scheme: Scheme;
}

export const DEFAULT_APPEARANCE: Appearance = { palette: "orbit", look: "orbit", scheme: "system" };
const STORAGE_KEY = "wp-kit-site.appearance";

function oneOf<T extends string>(value: unknown, allowed: readonly { value: T }[], fallback: T): T {
  return allowed.some((a) => a.value === value) ? (value as T) : fallback;
}

/** The saved choice, or the default. A bad or missing entry falls back field by field. */
export function loadAppearance(): Appearance {
  let raw: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (parsed && typeof parsed === "object") raw = parsed as Record<string, unknown>;
  } catch {
    // Storage blocked or corrupt: use the defaults.
  }
  return {
    palette: oneOf(raw.palette, PALETTES, DEFAULT_APPEARANCE.palette),
    look: oneOf(raw.look, LOOKS, DEFAULT_APPEARANCE.look),
    scheme: raw.scheme === "dark" || raw.scheme === "light" ? raw.scheme : "system",
  };
}

export function saveAppearance(a: Appearance): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  } catch {
    // Not saved: the choice still holds for this visit.
  }
}

export function prefersLight(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: light)").matches;
}

/** Writes the choice onto <html>. Orbit is the default, so it sets no attribute. */
export function applyAppearance(a: Appearance, root: HTMLElement = document.documentElement): void {
  root.classList.add("wp-manager");
  if (a.palette === "orbit") root.removeAttribute("data-wp-palette");
  else root.setAttribute("data-wp-palette", a.palette);
  if (a.look === "orbit") root.removeAttribute("data-wp-look");
  else root.setAttribute("data-wp-look", a.look);
  const light = a.scheme === "light" || (a.scheme === "system" && prefersLight());
  root.classList.toggle("wp-theme-light", light);
  root.style.colorScheme = light ? "light" : "dark";
}
