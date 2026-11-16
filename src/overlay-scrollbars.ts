/**
 * Overlay scrollbars (Firefox on Windows 11 and Linux, macOS by default) take
 * no room: the bar is drawn over the content, so the last column of a grid,
 * the end of a line in a textarea or the last row of a table sits under it.
 * `scrollbar-gutter` does not help, because it only reserves room for
 * classic scrollbars.
 *
 * `markOverlayScrollbars` measures once whether this browser draws its
 * scrollbars over the content and, when it does, sets `--wp-bar-room` on the
 * root element. Scrollers take `v-bar-room` (`watchBarRoom`), which marks
 * them `data-wp-bar="y"` / `"x"` only while they actually scroll, and add
 * `var(--wp-bar-room, 0px)` to their padding on the bar's side under that
 * mark. A box that fits, or a browser with classic scrollbars, is left as it
 * was.
 */
import { cancelLayout, queueLayout, type LayoutTask } from "./layout-batch";

/** Room for an overlay bar when it is hovered (Firefox widens it then). */
export const BAR_ROOM_PX = 12;

/** True when a scrolling box keeps its full width, i.e. the bar is drawn over
 *  the content. */
export function hasOverlayScrollbars(doc: Document = document): boolean {
  const probe = doc.createElement("div");
  probe.style.cssText = "position:absolute;top:-9999px;left:-9999px;width:100px;height:100px;overflow:scroll;visibility:hidden";
  doc.body.appendChild(probe);
  const overlay = probe.offsetWidth > 0 && probe.offsetWidth - probe.clientWidth === 0;
  probe.remove();
  return overlay;
}

/** Sets `--wp-bar-room` on the root when scrollbars are overlays. Returns
 *  whether it did. Safe to call more than once. */
export function markOverlayScrollbars(doc: Document = document): boolean {
  if (!doc.body) return false;
  const overlay = hasOverlayScrollbars(doc);
  const root = doc.documentElement.style;
  if (overlay) root.setProperty("--wp-bar-room", `${BAR_ROOM_PX}px`);
  else root.removeProperty("--wp-bar-room");
  return overlay;
}

/** Which axes of `el` scroll right now: "y", "x", "x y" or "". */
export function scrollingAxes(el: Element): string {
  const axes: string[] = [];
  if (el.scrollWidth > el.clientWidth + 1) axes.push("x");
  if (el.scrollHeight > el.clientHeight + 1) axes.push("y");
  return axes.join(" ");
}

/**
 * Keeps `data-wp-bar` on `el` set to the axes it scrolls on ("y", "x",
 * "x y"), so its CSS adds the bar room only where a bar is actually drawn:
 * `.x[data-wp-bar~="y"] { padding-inline-end: var(--wp-bar-room, 0px) }`.
 * A box that fits keeps its normal padding. Re-measures when the box or one
 * of its children changes size, children come or go, or text is typed.
 * Returns a stop function.
 *
 * The measuring is deferred to the shared layout pass (`layout-batch.ts`):
 * however many changes land in a frame (a list re-rendering row by row as a
 * search is typed, every key in a textarea), each box is measured once, and
 * all boxes on the page are measured together after the frame's DOM writes
 * instead of forcing a layout inside every mutation callback.
 */
export function watchBarRoom(el: HTMLElement): () => void {
  let axes = "";
  // Measured without the room: the room narrows the box, which can make
  // content that wraps (a grid with `1fr` columns, text) short enough to fit,
  // and deciding on that would take the room away and put it back forever.
  const task: LayoutTask = {
    prepare() {
      if (el.hasAttribute("data-wp-bar")) el.removeAttribute("data-wp-bar");
    },
    measure() {
      axes = el.isConnected ? scrollingAxes(el) : "";
    },
    apply() {
      if (axes) el.setAttribute("data-wp-bar", axes);
    },
  };
  const update = (): void => { queueLayout(task, task); };

  const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
  // Direct children are watched for size, so growth deeper down (a row
  // getting taller) still reaches us through the child that holds it.
  const watched = new Set<Element>();
  const observeChildren = (): void => {
    if (!ro) return;
    for (const child of watched) {
      if (child.parentElement !== el) { ro.unobserve(child); watched.delete(child); }
    }
    for (const child of Array.from(el.children)) {
      if (!watched.has(child)) { ro.observe(child); watched.add(child); }
    }
  };
  const mo = typeof MutationObserver === "undefined"
    ? null
    : new MutationObserver((records) => {
      // Re-sync the observed children only when the box's own children
      // changed; re-observing them all made each one report again.
      if (records.some((r) => r.type === "childList" && r.target === el)) observeChildren();
      update();
    });
  mo?.observe(el, { childList: true, subtree: true, characterData: true });
  el.addEventListener("input", update);
  ro?.observe(el);
  observeChildren();
  update();
  return () => {
    ro?.disconnect();
    mo?.disconnect();
    cancelLayout(task);
    el.removeEventListener("input", update);
  };
}

const stops = new WeakMap<HTMLElement, () => void>();

/** `v-bar-room`: `watchBarRoom` for the element's lifetime. */
export const vBarRoom = {
  mounted(el: HTMLElement): void { stops.set(el, watchBarRoom(el)); },
  unmounted(el: HTMLElement): void { stops.get(el)?.(); stops.delete(el); },
};
