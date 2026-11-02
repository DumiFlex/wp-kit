<script setup lang="ts">
/**
 * The search box in the site's bar: type part of a name, a file or what a
 * piece is for, and the list under it shows the pieces and sections that
 * match. The arrows light a result, Enter (or a click) jumps to it, Escape
 * closes the list and a second Escape clears the box. "/" or Mod+K from
 * anywhere on the page puts the cursor in the box.
 *
 * Built from the kit's SearchInput and Popover, with the list wired the way
 * Combobox does it: focus stays in the box and the lit result is named by
 * aria-activedescendant.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import Popover from "@kit/Popover.vue";
import SearchInput from "@kit/SearchInput.vue";
import VisuallyHidden from "@kit/VisuallyHidden.vue";
import { search, searchItems, type SearchResult } from "./search";

const ITEMS = searchItems();
const listId = `wp-site-search-${useId()}`;

const query = ref("");
const focused = ref(false);
const active = ref(0);
const box = ref<InstanceType<typeof SearchInput> | null>(null);

const results = computed<SearchResult[]>(() => search(query.value, ITEMS));
const hasQuery = computed(() => query.value.trim().length > 0);
const open = computed(() => focused.value && hasQuery.value);
const activeId = computed(() => (open.value && results.value.length ? `${listId}-${active.value}` : undefined));
const status = computed(() => {
  if (!hasQuery.value) return "";
  const n = results.value.length;
  return n ? `${n} ${n === 1 ? "result" : "results"}` : "No results";
});

watch(query, () => { active.value = 0; });

function step(dir: 1 | -1): void {
  const n = results.value.length;
  if (!n) return;
  active.value = (active.value + dir + n) % n;
  void nextTick(() => document.getElementById(`${listId}-${active.value}`)?.scrollIntoView?.({ block: "nearest" }));
}

/** Jumps to a result: the hash scrolls it into view (and `:target` flashes
 *  it), then focus moves to it so the keyboard carries on from there. */
function go(r: SearchResult | undefined): void {
  if (!r) return;
  const el = document.getElementById(r.item.target);
  focused.value = false;
  query.value = "";
  if (!el) return;
  if (location.hash === `#${r.item.target}`) el.scrollIntoView({ block: "start" });
  else location.hash = r.item.target;
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

function onKeydown(ev: KeyboardEvent): void {
  switch (ev.key) {
    case "ArrowDown":
    case "ArrowUp":
      ev.preventDefault();
      focused.value = true;
      step(ev.key === "ArrowDown" ? 1 : -1);
      return;
    case "Enter":
      if (!open.value) return;
      ev.preventDefault();
      go(results.value[active.value]);
      return;
    default:
  }
}

function onPick(r: SearchResult): void {
  go(r);
}

/** "/" (when not typing somewhere else) or Mod+K focuses the box. */
function onGlobalKey(ev: KeyboardEvent): void {
  const t = ev.target;
  const typing = t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  const modK = (ev.ctrlKey || ev.metaKey) && !ev.altKey && ev.key.toLowerCase() === "k";
  if (!modK && (ev.key !== "/" || typing || ev.ctrlKey || ev.metaKey || ev.altKey)) return;
  ev.preventDefault();
  box.value?.focus();
  box.value?.select();
}
onMounted(() => window.addEventListener("keydown", onGlobalKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onGlobalKey));

function setOpen(v: boolean): void {
  if (!v) focused.value = false;
}
</script>

<!-- Popover's autofocus prop is off here: focus stays in the box you type in. -->
<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<template>
  <div class="wp-site-search" role="search">
    <Popover :open="open" role="group" match-width :autofocus="false" label="Search results" @update:open="setOpen">
      <template #trigger>
        <SearchInput
          ref="box"
          v-model="query"
          class="wp-site-search__box"
          placeholder="Search the kit…"
          aria-label="Search the kit"
          shortcut="Mod+K"
          role="combobox"
          aria-autocomplete="list"
          :aria-expanded="open"
          :aria-controls="open ? listId : undefined"
          :aria-activedescendant="activeId"
          data-test="site-search"
          @focus="focused = true"
          @blur="focused = false"
          @input="focused = true"
          @keydown="onKeydown"
        />
      </template>
      <ul :id="listId" class="wp-site-search__list" role="listbox" aria-label="Search results">
        <!-- Results are lit with aria-activedescendant; the box keeps focus and the keys. -->
        <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/interactive-supports-focus -->
        <li
          v-for="(r, i) in results"
          :id="`${listId}-${i}`"
          :key="r.item.target"
          class="wp-site-search__opt"
          role="option"
          :aria-selected="i === active"
          :data-active="i === active || undefined"
          :data-test="`site-search-result-${r.item.target}`"
          @mousedown.prevent
          @mousemove="active = i"
          @click="onPick(r)"
        >
          <i
            class="pi wp-site-search__icon"
            :class="r.item.kind === 'section' ? 'pi-hashtag' : 'pi-box'"
            aria-hidden="true"
          />
          <span class="wp-site-search__text">
            <span class="wp-site-search__head">
              <span class="wp-site-search__name">
                <template v-for="(s, k) in r.name" :key="k"><mark v-if="s.hit">{{ s.text }}</mark><template v-else>{{ s.text }}</template></template>
              </span>
              <span class="wp-site-search__where">{{ r.item.where }}</span>
            </span>
            <span class="wp-site-search__snippet">
              <template v-for="(s, k) in r.snippet" :key="k"><mark v-if="s.hit">{{ s.text }}</mark><template v-else>{{ s.text }}</template></template>
            </span>
          </span>
        </li>
        <li v-if="!results.length" class="wp-site-search__empty" role="presentation" data-test="site-search-empty">
          Nothing in the kit matches “{{ query.trim() }}”.
        </li>
      </ul>
    </Popover>
    <VisuallyHidden aria-live="polite">{{ status }}</VisuallyHidden>
  </div>
</template>

<style scoped>
.wp-site-search { flex: 1 1 240px; max-width: 380px; min-width: 0; display: flex; }
.wp-site-search :deep(.wp-popover-anchor) { width: 100%; }
.wp-site-search__box { width: 100%; }

.wp-site-search__list {
  margin: calc(var(--wp-space-2) * -1);
  padding: 0;
  list-style: none;
  width: min(420px, calc(100vw - 32px));
  max-height: min(440px, calc(100vh - 120px));
  overflow: auto;
}
.wp-site-search__opt {
  display: flex;
  align-items: flex-start;
  gap: var(--wp-space-3);
  padding: 7px var(--wp-space-4) 7px var(--wp-space-3);
  border-radius: var(--wp-radius-sm);
  color: var(--wp-text);
  cursor: pointer;
}
.wp-site-search__opt[data-active] { background: var(--wp-row-hover); box-shadow: inset 2px 0 0 var(--wp-accent); }
.wp-site-search__icon { width: 14px; margin-top: 3px; font-size: 11px; color: var(--wp-text-dim); }
.wp-site-search__opt[data-active] .wp-site-search__icon { color: var(--wp-accent-text); }
.wp-site-search__text { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.wp-site-search__head { display: flex; align-items: baseline; gap: var(--wp-space-3); min-width: 0; }
.wp-site-search__name { font-size: var(--wp-text-sm); font-weight: 600; min-width: 0; overflow-wrap: anywhere; }
.wp-site-search__where { margin-left: auto; flex-shrink: 0; color: var(--wp-text-dim); font-size: var(--wp-text-xs); }
.wp-site-search__snippet {
  color: var(--wp-text-muted);
  font-size: var(--wp-text-xs);
  line-height: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.wp-site-search__list mark {
  background: none;
  color: var(--wp-accent-text);
  font-weight: 600;
}
.wp-site-search__empty { padding: 8px var(--wp-space-4); color: var(--wp-text-muted); font-size: var(--wp-text-sm); }
</style>
