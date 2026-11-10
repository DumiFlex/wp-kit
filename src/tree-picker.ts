/**
 * Tree logic for TreePicker: walk a tree of `{ id, label, children }` nodes
 * into rows with their ancestor path, find matches for a search, and count
 * the picks under each top-level node. No Vue, so it tests on its own.
 */

export interface TreePickerNode {
  /** What goes in the v-model (a category slug, say). */
  id: string;
  label: string;
  children?: TreePickerNode[] | undefined;
}

export interface TreePickerRow {
  id: string;
  /** The node's own label, trimmed. */
  label: string;
  /** Labels of the nodes above it, outermost first (empty at the top). */
  path: string[];
}

/** Every node under `nodes` (the nodes included), parents before children. */
export function flattenTree(nodes: readonly TreePickerNode[], path: string[] = []): TreePickerRow[] {
  const out: TreePickerRow[] = [];
  for (const n of nodes) {
    const label = n.label.trim();
    out.push({ id: n.id, label, path });
    if (n.children?.length) out.push(...flattenTree(n.children, [...path, label]));
  }
  return out;
}

/** Folds case and accents so "cafe" finds "Café". */
function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Rows whose label or path holds every word of `query`. Rows whose own label
 * holds the words come first (a search for "hair" lists "Hair" before
 * "Hair › Colour"); otherwise tree order.
 */
export function searchTree(rows: readonly TreePickerRow[], query: string): TreePickerRow[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [...rows];
  const own: TreePickerRow[] = [];
  const viaPath: TreePickerRow[] = [];
  for (const r of rows) {
    const label = fold(r.label);
    const full = fold([...r.path, r.label].join(" "));
    if (!words.every((w) => full.includes(w))) continue;
    (words.every((w) => label.includes(w)) ? own : viaPath).push(r);
  }
  return [...own, ...viaPath];
}

/** How many of `picked` are `node` or sit under it. */
export function pickedUnder(node: TreePickerNode, picked: ReadonlySet<string>): number {
  let n = picked.has(node.id) ? 1 : 0;
  for (const c of node.children ?? []) n += pickedUnder(c, picked);
  return n;
}

/** Adds or removes `id`, keeping order; adds nothing once `max` are picked. */
export function togglePick(value: readonly string[], id: string, max: number): string[] {
  if (value.includes(id)) return value.filter((v) => v !== id);
  if (value.length >= max) return [...value];
  return [...value, id];
}
