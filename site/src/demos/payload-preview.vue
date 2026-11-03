<script setup lang="ts">
import { ref } from "vue";
import PayloadPreview from "@kit/PayloadPreview.vue";
import WpSegmented, { type SegmentedOption } from "@kit/WpSegmented.vue";

type Kind = "wildcard" | "derivation" | "bundle";
const kind = ref<Kind>("wildcard");
const KINDS: SegmentedOption<Kind>[] = [
  { value: "wildcard", label: "Wildcard" },
  { value: "derivation", label: "Derivation" },
  { value: "bundle", label: "Bundle" },
];

const wildcard = {
  id: "aaaa1111", type: "wildcard", name: "Palette",
  payload: {
    var_binding: "palette",
    tag_groups: { temperature: ["warm", "cool"] },
    options: [
      { value: "amber and rose", weight: 2, sub_categories: ["warm"] },
      { value: "burnt {orange|sienna}", sub_categories: ["warm"], negative: "neon" },
      { value: "teal and slate", sub_categories: ["cool"] },
      { value: "icy blue, $mood light", sub_categories: ["cool"], fallback: true },
    ],
  },
};
const derivation = {
  id: "bbbb2222", type: "derivation", name: "Mood from palette",
  payload: {
    rules: [{
      branches: [
        {
          condition: { match: "any", conditions: [{ var: "palette", op: "contains", value: "amber" }, { var: "palette", op: "contains", value: "rose" }] },
          action: { target_var: "mood", mode: "replace", value: "golden hour" },
          extra_actions: [{ target_var: "mood", mode: "negative", value: "overcast" }],
        },
      ],
      else: { action: { target_var: "mood", mode: "replace", value: "blue hour" } },
    }],
  },
};
const combine = {
  id: "cccc3333", type: "combine", name: "Scene",
  payload: { output_var: "scene", template: "$palette sky, $mood, @{aaaa1111}", input_vars: ["palette", "mood"] },
};
const bundle = { children: [wildcard, derivation, combine] };
const payloads: Record<Kind, Record<string, unknown>> = { wildcard, derivation, bundle };
const names = { aaaa1111: "Palette" };
</script>

<template>
  <div class="wp-kit__stack wp-kit__stack--wide">
    <WpSegmented v-model="kind" :options="KINDS" size="sm" aria-label="Payload type" />
    <PayloadPreview :payload="payloads[kind]" :ref-names="names" />
  </div>
</template>
