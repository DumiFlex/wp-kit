<script setup lang="ts">
/**
 * Code block: text that must stay as written (JSON, a prompt as sent, a log,
 * a snippet), in the mono font, with a copy button and a wrap switch in its
 * head. Long text scrolls inside `max-height`. Works on the canvas and in the
 * manager.
 *
 *   <CodeBlock :code="json" language="JSON" max-height="240px" />
 *   <CodeBlock :code="log" title="Request" line-numbers v-model:wrap="wrap" />
 *
 * Syntax colours come from `language` (JSON, TS, Vue/HTML, CSS, shell, the
 * prompt template grammar; see highlight.ts), or from `syntax` when the head
 * shows a title instead of a language tag:
 *
 *   <CodeBlock :code="template" title="Template" syntax="prompt" />
 *
 * Unknown languages stay plain. The colours are shared tokens, so a block
 * reads right on the canvas, in the manager and in light mode. A block that
 * scrolls can be focused, so the keyboard can scroll it too.
 */
import { computed, ref, watch } from "vue";
import CopyButton from "./CopyButton.vue";
import { vTooltip } from "./tooltip";
import { vBarRoom } from "./overlay-scrollbars";
import { highlight, highlightLanguage, highlightLines } from "./highlight";

const props = withDefaults(defineProps<{
  code: string;
  /** A small tag in the head, e.g. "JSON". Also picks the syntax colours. */
  language?: string | undefined;
  /** Syntax colours without a tag in the head ("prompt", "json", "ts" …). */
  syntax?: string | undefined;
  /** A name in the head, e.g. "Prompt as sent". */
  title?: string | undefined;
  /** Wrap long lines. Bind with v-model:wrap, or leave it to the button. */
  wrap?: boolean | undefined;
  /** Where wrap starts when nobody binds `wrap`. */
  defaultWrap?: boolean | undefined;
  /** CSS max height; the block scrolls past it. */
  maxHeight?: string | undefined;
  lineNumbers?: boolean | undefined;
  /** Leave out the head (copy and wrap). */
  bare?: boolean | undefined;
  size?: "sm" | "md" | undefined;
}>(), { language: undefined, syntax: undefined, title: undefined, wrap: undefined, maxHeight: undefined, size: "md" });

const emit = defineEmits<{ (e: "update:wrap", v: boolean): void }>();

const own = ref(props.wrap ?? props.defaultWrap ?? false);
watch(() => props.wrap, (v) => { if (v !== undefined) own.value = v; });
const wrapped = computed(() => props.wrap ?? own.value);
function toggleWrap(): void {
  own.value = !wrapped.value;
  emit("update:wrap", own.value);
}

const tokens = computed(() => highlight(props.code, highlightLanguage(props.syntax ?? props.language)));
const lines = computed(() => highlightLines(highlight(props.code.replace(/\n$/, ""), highlightLanguage(props.syntax ?? props.language))));
const name = computed(() => props.title ?? props.language ?? "Code");
</script>

<template>
  <figure class="wp-code" :data-size="size" :data-wrap="wrapped || undefined">
    <figcaption v-if="!bare" class="wp-code__head">
      <span class="wp-code__title">{{ title }}</span>
      <span v-if="language" class="wp-code__lang">{{ language }}</span>
      <span class="wp-code__tools">
        <button
          v-tooltip="wrapped ? 'Don’t wrap lines' : 'Wrap lines'"
          type="button"
          class="wp-code__tool"
          :aria-pressed="wrapped"
          aria-label="Wrap lines"
          @click="toggleWrap"
        ><i class="pi pi-align-left" aria-hidden="true" /></button>
        <CopyButton :text="code" :label="`Copy ${name.toLowerCase() === 'code' ? 'code' : name}`" size="sm" />
      </span>
    </figcaption>
    <pre
      v-bar-room
      class="wp-code__pre"
      tabindex="0"
      :aria-label="name"
      :style="{ maxHeight }"
    ><code v-if="!lineNumbers" class="wp-code__code"><template v-for="(t, i) in tokens" :key="i"><span v-if="t.kind !== 'plain'" :class="`wp-code__t--${t.kind}`">{{ t.text }}</span><template v-else>{{ t.text }}</template></template></code><code v-else class="wp-code__code wp-code__code--numbered"><span v-for="(l, i) in lines" :key="i" class="wp-code__line"><span class="wp-code__num" aria-hidden="true">{{ i + 1 }}</span><span class="wp-code__text"><template v-for="(t, j) in l" :key="j"><span v-if="t.kind !== 'plain'" :class="`wp-code__t--${t.kind}`">{{ t.text }}</span><template v-else>{{ t.text }}</template></template><template v-if="!l.length">{{ "\u00a0" }}</template></span></span></code></pre>
  </figure>
</template>

<style scoped>
.wp-code {
  display: flex; flex-direction: column; min-width: 0; margin: 0;
  border: 1px solid var(--wp-border); border-radius: var(--wp-radius);
  background: var(--wp-bg-1); overflow: hidden;
}
.wp-code__head {
  display: flex; align-items: center; gap: var(--wp-space-3); min-height: 28px;
  padding: 2px var(--wp-space-2) 2px var(--wp-space-4);
  border-bottom: 1px solid var(--wp-border-soft); background: var(--wp-bg-2);
  color: var(--wp-text-muted); font: 500 var(--wp-text-xs)/1.2 var(--wp-font-sans);
}
.wp-code__title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--wp-text); }
.wp-code__lang {
  padding: 1px 6px; border-radius: var(--wp-radius-sm); background: var(--wp-bg-3);
  font: 600 10px/1.4 var(--wp-font-mono); letter-spacing: 0.04em; text-transform: uppercase;
}
.wp-code__tools { display: inline-flex; align-items: center; gap: 2px; margin-left: auto; }
.wp-code__tool {
  display: inline-grid; place-items: center; width: var(--wp-control-h-sm); height: var(--wp-control-h-sm);
  margin: 0; padding: 0; border: 0; border-radius: var(--wp-radius-sm);
  background: transparent; color: var(--wp-text-muted); cursor: pointer;
}
.wp-code__tool .pi { font-size: 12px; }
.wp-code__tool:hover { background: var(--wp-row-hover); color: var(--wp-text); }
.wp-code__tool[aria-pressed="true"] { color: var(--wp-accent-text); background: var(--wp-bg-3); }
.wp-code__tool:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--wp-border-focus); }
.wp-code__pre {
  margin: 0; padding: var(--wp-space-4); overflow: auto;
  color: var(--wp-text); font: 400 var(--wp-text-sm)/1.55 var(--wp-font-mono);
  white-space: pre; tab-size: 2;
  /* Code shows as written: no `===` or `<!--` ligatures. */
  font-variant-ligatures: none;
}
.wp-code[data-size="sm"] .wp-code__pre { padding: var(--wp-space-3); font-size: var(--wp-text-xs); }
.wp-code[data-wrap] .wp-code__pre { white-space: pre-wrap; overflow-wrap: anywhere; }
/* An overlay scrollbar (Firefox, macOS) is drawn over the last line otherwise. */
.wp-code__pre[data-wp-bar~="x"] { padding-bottom: calc(var(--wp-space-4) + var(--wp-bar-room, 0px)); }
.wp-code__pre:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--wp-border-focus); }
.wp-code__code { font: inherit; background: none; padding: 0; color: inherit; }
.wp-code__code--numbered { display: table; }
.wp-code__line { display: table-row; }
.wp-code__num {
  display: table-cell; padding-right: var(--wp-space-4); text-align: right;
  color: var(--wp-text-dim); user-select: none; font-variant-numeric: tabular-nums;
}
.wp-code__text { display: table-cell; }

/* Syntax colours: shared tokens only, so they hold on the canvas and in light mode. */
.wp-code__t--keyword { color: var(--wp-violet); }
.wp-code__t--string { color: var(--wp-green); }
.wp-code__t--number { color: var(--wp-amber); }
.wp-code__t--comment { color: var(--wp-text-dim); font-style: italic; }
.wp-code__t--punct { color: var(--wp-text-muted); }
.wp-code__t--key, .wp-code__t--attr { color: var(--wp-teal); }
.wp-code__t--tag { color: var(--wp-rose); }
.wp-code__t--fn { color: var(--wp-info); }
.wp-code__t--var { color: var(--wp-accent-text); }
.wp-code__t--ref { color: var(--wp-teal); }
.wp-code__t--brace { color: var(--wp-amber); }
.wp-code__t--escape { color: var(--wp-text-dim); }
</style>
