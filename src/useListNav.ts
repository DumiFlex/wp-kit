import { computed, nextTick, ref, type ComputedRef, type Ref } from "vue";

/**
 * The lit row of a list you walk with the arrow keys while focus stays
 * somewhere else (a text box that autocompletes, a picker's search field):
 * the `aria-activedescendant` pattern. Combobox and TagInput run on it, and
 * so can an app's caret autocomplete or command palette.
 *
 *   const nav = useListNav({ count: () => items.value.length, idPrefix: listId });
 *   <input :aria-activedescendant="nav.activeId.value" @keydown="(e) => nav.onKey(e, (i) => pick(items[i]))">
 *   <div v-for="(it, i) in items" :id="nav.idFor(i)" :data-active="nav.active.value === i || undefined" @mouseenter="nav.set(i)">…</div>
 *
 * ArrowDown / ArrowUp step (wrapping, skipping `disabled` rows; the first
 * press from nothing lit lands on the first or last row), Home / End jump
 * when `homeEnd` is on (leave it off in a text box, where they move the
 * caret), Enter picks the lit row. The lit row scrolls into view. `onKey`
 * returns true when it used the key, so the caller can handle the rest.
 */
export interface ListNavOptions {
  /** How many rows the list has now. */
  count: () => number;
  /** Rows the keys skip. */
  disabled?: ((i: number) => boolean) | undefined;
  /** Row ids are `${idPrefix}-${i}`; used for activeId and scrolling. */
  idPrefix?: string | undefined;
  /** Step past the ends back round (on by default). */
  wrap?: boolean | undefined;
  /** Home / End jump to the first / last row. */
  homeEnd?: boolean | undefined;
}

export interface ListNav {
  /** The lit row, or -1 for none. */
  active: Ref<number>;
  /** The lit row's element id, for `aria-activedescendant`. */
  activeId: ComputedRef<string | undefined>;
  idFor: (i: number) => string;
  /** Light row `i` (a hover). */
  set: (i: number) => void;
  /** Light nothing. */
  reset: () => void;
  /** Light the first row the keys may land on (after typing). */
  first: () => void;
  step: (dir: 1 | -1) => void;
  onKey: (ev: KeyboardEvent, pick?: (i: number) => void) => boolean;
}

export function useListNav(opts: ListNavOptions): ListNav {
  const active = ref(-1);
  const prefix = opts.idPrefix ?? "wp-list";
  const wrap = opts.wrap ?? true;
  const off = (i: number): boolean => opts.disabled?.(i) ?? false;
  const idFor = (i: number): string => `${prefix}-${i}`;
  const activeId = computed(() => (active.value >= 0 && active.value < opts.count() ? idFor(active.value) : undefined));

  function show(i: number): void {
    if (typeof document === "undefined" || !opts.idPrefix) return;
    void nextTick(() => document.getElementById(idFor(i))?.scrollIntoView?.({ block: "nearest" }));
  }

  function land(i: number): void {
    active.value = i;
    if (i >= 0) show(i);
  }

  function step(dir: 1 | -1): void {
    const n = opts.count();
    if (!n) return;
    let i = active.value;
    for (let k = 0; k < n; k++) {
      if (i < 0 || i >= n) i = dir > 0 ? 0 : n - 1;
      else if (wrap) i = (i + dir + n) % n;
      else i = Math.min(n - 1, Math.max(0, i + dir));
      if (!off(i)) break;
    }
    if (off(i)) return;
    land(i);
  }

  function edge(dir: 1 | -1): void {
    active.value = -1;
    step(dir);
  }

  function first(): void {
    const n = opts.count();
    for (let i = 0; i < n; i++) if (!off(i)) { active.value = i; return; }
    active.value = -1;
  }

  function onKey(ev: KeyboardEvent, pick?: (i: number) => void): boolean {
    switch (ev.key) {
      case "ArrowDown":
      case "ArrowUp":
        if (!opts.count()) return false;
        ev.preventDefault();
        step(ev.key === "ArrowDown" ? 1 : -1);
        return true;
      case "Home":
      case "End":
        if (!opts.homeEnd || !opts.count()) return false;
        ev.preventDefault();
        edge(ev.key === "Home" ? 1 : -1);
        return true;
      case "Enter": {
        const i = active.value;
        if (!pick || i < 0 || i >= opts.count() || off(i)) return false;
        ev.preventDefault();
        pick(i);
        return true;
      }
      default:
        return false;
    }
  }

  return {
    active,
    activeId,
    idFor,
    set: (i) => { if (!off(i)) active.value = i; },
    reset: () => { active.value = -1; },
    first,
    step,
    onKey,
  };
}
