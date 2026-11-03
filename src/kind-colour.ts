/**
 * The colour of each module type, for a Chip (or anything else) that names
 * one: the `--wp-kind-*` colour the extension uses for that type, bundles
 * slate, and its icon (`kindIcon`). There is no kind chip: a kind is a Chip
 * with this colour.
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

/** The PrimeIcons name (for Icon / ListRow `icon`) of each item type: the
 *  same icons the extension's kind-icons map uses. */
const ICONS: Record<ItemType, string> = {
  wildcard: "sparkles",
  fixed_values: "tag",
  combine: "link",
  derivation: "arrow-right-arrow-left",
  constraint: "filter",
  bundle: "box",
};

/** The icon of a type read from a payload (any string): `circle` for a type
 *  the kit doesn't know. */
export function kindIcon(type: string): string {
  return (ICONS as Record<string, string>)[type] ?? "circle";
}

/** A payload's type string as a module subtype, or null when it isn't one. */
export function moduleSubtype(type: string): ModuleSubtype | null {
  return type === "fixed_values" || type === "combine" || type === "wildcard" || type === "constraint" || type === "derivation" ? type : null;
}
