<script setup lang="ts">
/**
 * A piece's API under its demo, folded by default: props (type, default,
 * required, what it does), events with their payload, slots and what the
 * piece exposes. The tables come from `virtual:kit-api`, read from the
 * component's own types, so they always match the code.
 */
import { computed } from "vue";
import Disclosure from "@kit/Disclosure.vue";
import type { KitApiTable } from "./kit-api-types";
import { KIT_API_TEXT as T } from "./registry";

const props = defineProps<{ api: KitApiTable }>();

const summary = computed(() => {
  const a = props.api;
  const parts: string[] = [];
  const add = (n: number, one: string, many: string): void => { if (n) parts.push(`${n} ${n === 1 ? one : many}`); };
  add(a.props.length, T.prop, T.props);
  add(a.events.length, T.event, T.events);
  add(a.slots.length, T.slot, T.slots);
  add(a.exposed.length, T.method, T.methods);
  return parts.join(" · ");
});
const empty = computed(() => !summary.value);
/** `update:modelValue` reads better as the v-model it is. */
const eventName = (n: string): string => (n.startsWith("update:") ? `${n} (v-model${n === "update:modelValue" ? "" : `:${n.slice(7)}`})` : n);
/** Event payload "[v: number]" → "v: number"; "[]" → nothing. */
const payload = (t: string): string => t.replace(/^\[(.*)\]$/s, "$1");
</script>

<template>
  <Disclosure v-if="!empty" class="wp-kit-api" :label="T.label" :count="summary" size="sm" lazy data-test="kit-api">
    <div class="wp-kit-api__body">
      <section v-if="api.props.length">
        <h4 class="wp-kit-api__title">{{ T.propsTitle }}</h4>
        <div class="wp-table-wrap">
          <table class="wp-table wp-kit-api__table">
            <thead><tr><th>{{ T.name }}</th><th>{{ T.type }}</th><th>{{ T.default }}</th><th>{{ T.description }}</th></tr></thead>
            <tbody>
              <tr v-for="p in api.props" :key="p.name" :data-prop="p.name">
                <td><code class="wp-kit-api__name">{{ p.name }}</code><span v-if="p.required" class="wp-kit-api__req" :title="T.requiredTitle">{{ T.required }}</span></td>
                <td><code class="wp-kit-api__type">{{ p.type }}</code></td>
                <td><code v-if="p.default !== undefined" class="wp-kit-api__type">{{ p.default }}</code><span v-else class="wp-kit-api__none">—</span></td>
                <td class="wp-kit-api__desc">{{ p.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section v-if="api.events.length">
        <h4 class="wp-kit-api__title">{{ T.eventsTitle }}</h4>
        <div class="wp-table-wrap">
          <table class="wp-table wp-kit-api__table">
            <thead><tr><th>{{ T.name }}</th><th>{{ T.payload }}</th><th>{{ T.description }}</th></tr></thead>
            <tbody>
              <tr v-for="e in api.events" :key="e.name">
                <td><code class="wp-kit-api__name">{{ eventName(e.name) }}</code></td>
                <td><code v-if="payload(e.type)" class="wp-kit-api__type">{{ payload(e.type) }}</code><span v-else class="wp-kit-api__none">—</span></td>
                <td class="wp-kit-api__desc">{{ e.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section v-if="api.slots.length">
        <h4 class="wp-kit-api__title">{{ T.slotsTitle }}</h4>
        <div class="wp-table-wrap">
          <table class="wp-table wp-kit-api__table">
            <thead><tr><th>{{ T.name }}</th><th>{{ T.slotProps }}</th><th>{{ T.description }}</th></tr></thead>
            <tbody>
              <tr v-for="s in api.slots" :key="s.name">
                <td><code class="wp-kit-api__name">#{{ s.name }}</code></td>
                <td><code v-if="s.type !== '{}' && s.type !== 'any'" class="wp-kit-api__type">{{ s.type }}</code><span v-else class="wp-kit-api__none">—</span></td>
                <td class="wp-kit-api__desc">{{ s.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section v-if="api.exposed.length">
        <h4 class="wp-kit-api__title">{{ T.exposedTitle }}</h4>
        <div class="wp-table-wrap">
          <table class="wp-table wp-kit-api__table">
            <thead><tr><th>{{ T.name }}</th><th>{{ T.type }}</th><th>{{ T.description }}</th></tr></thead>
            <tbody>
              <tr v-for="x in api.exposed" :key="x.name">
                <td><code class="wp-kit-api__name">{{ x.name }}</code></td>
                <td><code class="wp-kit-api__type">{{ x.type }}</code></td>
                <td class="wp-kit-api__desc">{{ x.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </Disclosure>
</template>

<style scoped>
.wp-kit-api__body { display: flex; flex-direction: column; gap: var(--wp-space-5); padding-top: var(--wp-space-3); }
.wp-kit-api__title {
  margin: 0 0 var(--wp-space-2);
  font-size: var(--wp-text-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--wp-text-dim);
}
.wp-kit-api__table { font-size: var(--wp-text-sm); }
.wp-kit-api__table td { vertical-align: top; }
.wp-kit-api__name { font: var(--wp-text-sm) / 18px var(--wp-font-mono); color: var(--wp-accent); white-space: nowrap; }
.wp-kit-api__type { font: var(--wp-text-xs) / 18px var(--wp-font-mono); color: var(--wp-text-muted); overflow-wrap: break-word; }
.wp-kit-api__req { margin-left: var(--wp-space-2); font-size: var(--wp-text-xs); color: var(--wp-warn); }
.wp-kit-api__none { color: var(--wp-text-dim); }
.wp-kit-api__desc { color: var(--wp-text-muted); min-width: 18ch; }
</style>
