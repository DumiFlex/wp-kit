<script setup lang="ts">
/**
 * Inline rich-text renderer for plain-text prose (post descriptions, notes).
 *
 *   <p class="my-description"><RichText :text="post.description" /></p>
 *
 * Turns URLs into links (new tab, `noopener noreferrer`) and `$var` /
 * `@{ref}` mentions into `<code>` chips, WITHOUT `v-html`: every segment from
 * `parseRichText` (linkify.ts) is rendered as a Vue node, so the output is
 * XSS-safe by construction.
 *
 * Prose, not a grammar value: `{a|b}` stays text and a ref's body may be any
 * words. A wildcard value (picks, refs resolved to names) is TokenizedValue.
 *
 * Renders INLINE (no wrapper element), so it drops into the host's own
 * paragraph and inherits its typography.
 */
import { computed } from "vue";
import { parseRichText } from "./linkify";

const props = defineProps<{ text: string }>();

const segments = computed(() => parseRichText(props.text));
</script>

<template>
  <template
    v-for="(seg, idx) in segments"
    :key="idx"
  >
    <a
      v-if="seg.kind === 'link'"
      class="wp-rich-text__link"
      :href="seg.href"
      target="_blank"
      rel="noopener noreferrer"
    >{{ seg.text }}</a>
    <code
      v-else-if="seg.kind === 'code'"
      class="wp-rich-text__code"
    >{{ seg.text }}</code>
    <template v-else>{{ seg.text }}</template>
  </template>
</template>

<style scoped>
.wp-rich-text__link {
  color: var(--wp-accent-text);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.wp-rich-text__code {
  font-family: var(--wp-font-mono);
  font-size: 0.9em;
  background: var(--wp-bg-3);
  color: var(--wp-accent-text);
  padding: 1px 6px;
  border-radius: min(5px, var(--wp-radius-cap, 999px));
  border: 1px solid var(--wp-border);
}
</style>
