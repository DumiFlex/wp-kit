/** `virtual:kit-api`, built by `site/kit-api.ts`. `kit-api-types.ts` re-exports the types. */
declare module "virtual:kit-api" {
  export interface KitApiProp {
    name: string;
    type: string;
    required: boolean;
    default?: string;
    description: string;
  }
  export interface KitApiMember {
    name: string;
    type: string;
    description: string;
  }
  export interface KitApiTable {
    props: KitApiProp[];
    events: KitApiMember[];
    slots: KitApiMember[];
    exposed: KitApiMember[];
  }
  /** Keyed by repo path, as `KitEntry.file` writes it ("src/Chip.vue"). */
  export type KitApi = Record<string, KitApiTable>;
  const api: KitApi;
  export default api;
}
