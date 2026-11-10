/**
 * Overlay scrollbars (Firefox on Windows 11 and Linux, macOS by default) take
 * no room: the bar is drawn over the content, so the last column of a grid,
 * the end of a line in a textarea or the last row of a table sits under it.
 * `scrollbar-gutter` does not help, because it only reserves room for
 * classic scrollbars.
 *
 * `markOverlayScrollbars` measures once whether this browser draws its
 * scrollbars over the content and, when it does, sets `--wp-bar-room` on the
 * root element. Scrollers add `var(--wp-bar-room, 0px)` to their padding on
 * the side the bar is drawn, so a browser with classic scrollbars is left as
 * it was.
 */

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
