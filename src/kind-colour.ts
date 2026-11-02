/**
 * The colour of each module type, for a Chip (or anything else) that names
 * one: the `--wp-kind-*` colour the extension uses for that type, bundles
 * slate. There is no kind chip: a kind is a Chip with this colour.
 *
 *   <Chip :color="kindColour(itemType(post.kind, post.subtype))">{{ itemType(post.kind, post.subtype) }}</Chip>
 */
export type ModuleSubtype = "fixed_values" | "combine" | "wildcard" | "constraint" | "derivation";
export type ItemType = ModuleSubtype | "bundle";

const COLOURS: Record<ItemType, string> = {
  fixed_values: "var(--wp-kind-fixed)",
  combine: "var(--wp-kind-combine)",
  wildcard: "var(--wp-kind-wildcard)",
  constraint: "var(--wp-kind-constraint)",
  derivation: "var(--wp-kind-derivation)",
  bundle: "var(--wp-bundle-default)",
};

/** A post or library item's type. A module with no subtype reads as
 *  `fixed_values` (the oldest type); a `"bundle"` subtype reads as a bundle. */
export function itemType(kind: "module" | "bundle", subtype?: ItemType | null): ItemType {
  return kind === "bundle" ? "bundle" : (subtype ?? "fixed_values");
}

export function kindColour(type: ItemType): string {
  return COLOURS[type];
}
