<script setup lang="ts">
/**
 * Rich, read-only preview of a published module or bundle payload: the
 * community post page and its embed draw it, and the manager can too.
 *
 *   <PayloadPreview :payload="row" :ref-names="names" :ref-groups="groups" />
 *
 * This file only picks the per-type preview (WildcardPreview,
 * FixedValuesPreview, CombinePreview, DerivationPreview, ConstraintPreview,
 * BundlePreview; each one
 * has a stats strip, its own search / paging for big payloads, and routes
 * every value through `TokenizedValue` so `$var` / `@{ref}` / picks render
 * as the chips the editor shows) and owns the Preview / Raw JSON tabs.
 *
 * The community renders the PUBLISHED payload, which has NO `instance`
 * layer — so only LIBRARY exceptions exist (`payload.exceptions`); the
 * instance-only `extra_exceptions` is ignored even if one rides along.
 */
import { computed, ref } from "vue";
import WildcardPreview from "./WildcardPreview.vue";
import FixedValuesPreview from "./FixedValuesPreview.vue";
import CombinePreview from "./CombinePreview.vue";
import DerivationPreview from "./DerivationPreview.vue";
import ConstraintPreview from "./ConstraintPreview.vue";
import BundlePreview from "./BundlePreview.vue";
import { innerOf, payloadKind } from "./preview-readers";
import WpTabs, { type TabItem } from "./WpTabs.vue";
import CodeBlock from "./CodeBlock.vue";

const PREVIEW_TABS: TabItem<"preview" | "raw">[] = [
  { id: "preview", label: "Preview" },
  { id: "raw", label: "Raw JSON" },
];

defineOptions({ name: "PayloadPreview" });

const props = withDefaults(
  defineProps<{
    payload: Record<string, unknown> | null;
    /**
     * `module_id → display-name` map, built by the parent from the post's
     * dependencies. Resolves constraint axis uuids AND any `@{uuid}` ref in
     * a value string to readable names — retroactively, no re-publish.
     */
    refNames?: Record<string, string>;
    /**
     * `module_id → tag_groups` map from the post's dependencies, so a
     * constraint can group its matrix by the wildcards' axes.
     */
    refGroups?: Record<string, Record<string, string[]>>;
    /** Show the Preview / Raw JSON tabs. The post page draws its own. */
    tabs?: boolean;
    /** Rendered inside a bundle's child pane (no tabs). */
    nested?: boolean;
  }>(),
  { refNames: () => ({}), refGroups: () => ({}), tabs: true, nested: false },
);

const tab = ref<"preview" | "raw">("preview");
const showTabs = computed(() => props.tabs && !props.nested);

const kind = computed(() => payloadKind(props.payload));
const inner = computed(() => innerOf(props.payload));
// withDefaults fills these, but the optional prop type still reads
// `| undefined` under exactOptionalPropertyTypes; pin concrete values.
const names = computed<Record<string, string>>(() => props.refNames ?? {});
const groups = computed<Record<string, Record<string, string[]>>>(() => props.refGroups ?? {});
const refMap = computed<ReadonlyMap<string, string>>(
  () => new Map(Object.entries(props.refNames)),
);
const rawJson = computed(() => (props.payload ? JSON.stringify(props.payload, null, 2) : ""));
const KNOWN = new Set(["wildcard", "fixed_values", "combine", "derivation", "constraint", "bundle"]);
</script>

<template>
  <div
    v-if="payload"
    class="wp-payload-preview"
  >
    <WpTabs
      v-if="showTabs"
      v-model="tab"
      :tabs="PREVIEW_TABS"
      aria-label="Preview or raw JSON"
    />

    <div v-if="tab === 'preview' || !showTabs">
      <WildcardPreview
        v-if="kind === 'wildcard'"
        :inner="inner"
        :ref-map="refMap"
      />
      <FixedValuesPreview
        v-else-if="kind === 'fixed_values'"
        :inner="inner"
        :ref-map="refMap"
      />
      <CombinePreview
        v-else-if="kind === 'combine'"
        :inner="inner"
        :ref-map="refMap"
      />
      <DerivationPreview
        v-else-if="kind === 'derivation'"
        :payload="payload"
        :inner="inner"
        :ref-map="refMap"
      />
      <ConstraintPreview
        v-else-if="kind === 'constraint'"
        :inner="inner"
        :ref-map="refMap"
        :ref-names="names"
        :ref-groups="groups"
      />
      <BundlePreview
        v-else-if="kind === 'bundle'"
        :payload="payload"
        :ref-names="names"
        :ref-groups="groups"
      />
      <p
        v-if="!kind || !KNOWN.has(kind)"
        class="wp-pv-empty"
      >
        Nothing to render in <code>{{ kind ?? "this payload" }}</code>. Switch to Raw JSON.
      </p>
    </div>
    <div
      v-else
      class="wp-payload-raw"
    >
      <CodeBlock
        :code="rawJson"
        language="JSON"
        default-wrap
      />
    </div>
  </div>
  <p
    v-else
    class="wp-pv-empty"
    style="padding: 24px"
  >
    No payload to preview.
  </p>
</template>

<style scoped src="./preview.css"></style>
<style scoped>
.wp-payload-raw {
  padding: 18px 24px 22px;
}
</style>
