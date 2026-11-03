/**
 * `v-toggle-row`: a click on a row's words flips the row's one checkbox or
 * switch, the way a `<label>` ticks its input. For a row that lays out its
 * label and its control itself (a label on the left, a switch on the right)
 * instead of passing the words to the Checkbox or WpSwitch.
 *
 *   <div v-toggle-row class="row">
 *     <span>Override base seed</span>
 *     <WpSwitch v-model="override" aria-label="Override base seed" />
 *   </div>
 *
 * It acts only when the row holds exactly one `role="checkbox"` or
 * `role="switch"` and no other value control (an input, a select, a slider,
 * radios), so a row with two switches or a switch beside a number field stays
 * as it is. A click on anything interactive inside the row (the toggle
 * itself, a button, a link, a native `<label>`, a labelled Checkbox) is left
 * to that element. The control keeps the keyboard stop and gets the focus.
 * SettingRow uses it on every row.
 *
 * The row gets the `wp-toggle-row` class while it has a single toggle, for
 * the pointer cursor (toggle-row.css). State lives in a WeakMap (no expando
 * keys), so the row's own attributes and serialization stay untouched.
 */
import type { Directive } from "vue";
import "./toggle-row.css";

const TOGGLE = '[role="checkbox"], [role="switch"]';
/** Value controls that make "the row's control" ambiguous. */
const OTHER_CONTROL =
  'input:not([type="hidden"]), select, textarea, [role="combobox"], [role="slider"], [role="spinbutton"], [role="radio"], [role="listbox"], [contenteditable=""], [contenteditable="true"]';
/** A click that lands on one of these belongs to it, not to the row. */
const INTERACTIVE =
  'button, a[href], input, select, textarea, label, summary, [role="button"], [role="link"], [role="checkbox"], [role="switch"], [role="radio"], [role="tab"], [role="menuitem"], [role="option"], [role="combobox"], [role="slider"], [role="spinbutton"], [contenteditable=""], [contenteditable="true"], .wp-checkbox';

interface State {
  off: () => void;
}

const states = new WeakMap<HTMLElement, State>();
/** One click flips one toggle, even with rows nested in rows. */
const handled = new WeakSet<Event>();

/** The row's one toggle, or null when it has none, several, or another control beside it. */
export function rowToggle(row: HTMLElement): HTMLElement | null {
  const toggles = row.querySelectorAll<HTMLElement>(TOGGLE);
  if (toggles.length !== 1) return null;
  if (row.querySelector(OTHER_CONTROL)) return null;
  return toggles[0] ?? null;
}

function isDisabled(el: HTMLElement): boolean {
  return el.getAttribute("aria-disabled") === "true" || (el instanceof HTMLButtonElement && el.disabled);
}

function sync(row: HTMLElement): void {
  const toggle = rowToggle(row);
  row.classList.toggle("wp-toggle-row", !!toggle);
  row.classList.toggle("wp-toggle-row--disabled", !!toggle && isDisabled(toggle));
}

/** Flip the row's toggle for a click on the row's words. Exported for tests. */
export function onRowClick(row: HTMLElement, event: MouseEvent): void {
  if (handled.has(event) || event.button !== 0) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  const hit = target.closest(INTERACTIVE);
  if (hit && hit !== row && row.contains(hit)) return;
  // Text the reader was selecting is not a click on the label.
  const selection = row.ownerDocument.getSelection?.();
  if (selection && !selection.isCollapsed && row.contains(selection.anchorNode)) return;
  const toggle = rowToggle(row);
  if (!toggle || isDisabled(toggle)) return;
  handled.add(event);
  toggle.click();
  toggle.focus({ preventScroll: true });
}

function attach(el: HTMLElement): void {
  if (states.has(el)) return;
  const click = (e: MouseEvent): void => onRowClick(el, e);
  el.addEventListener("click", click);
  states.set(el, { off: () => el.removeEventListener("click", click) });
}

function detach(el: HTMLElement): void {
  states.get(el)?.off();
  states.delete(el);
  el.classList.remove("wp-toggle-row", "wp-toggle-row--disabled");
}

/** `v-toggle-row="false"` turns it off for one row (a row whose words do something else). */
export const vToggleRow: Directive<HTMLElement, boolean | undefined> = {
  mounted(el, binding) {
    if (binding.value === false) return;
    attach(el);
    sync(el);
  },
  updated(el, binding) {
    if (binding.value === false) return detach(el);
    attach(el);
    sync(el);
  },
  unmounted: detach,
};
