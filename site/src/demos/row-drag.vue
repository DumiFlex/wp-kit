<script setup lang="ts">
import { ref } from "vue";
import { useRowDrag } from "@kit/row-drag";
import { targetIndex } from "@kit/sortable";

interface Row { id: string; name: string; kind: "socket" | "text" }
const rows = ref<Row[]>([
  { id: "a", name: "$character", kind: "socket" },
  { id: "b", name: "$outfit", kind: "socket" },
  { id: "c", name: "$scene", kind: "socket" },
  { id: "d", name: "$style", kind: "text" },
  { id: "e", name: "$quality", kind: "text" },
]);
const list = ref<HTMLElement | null>(null);
const drag = useRowDrag({
  list,
  // A row only lands among rows of its own kind.
  candidate: (el, from) => el.dataset.kind === rows.value.find((r) => r.id === from)?.kind,
  onDrop: (from, t) => {
    const same = rows.value.filter((r) => r.kind === rows.value.find((x) => x.id === from)?.kind);
    const i = same.findIndex((r) => r.id === from);
    const next = [...same];
    const [it] = next.splice(i, 1);
    next.splice(targetIndex(i, { over: t.index, edge: t.edge }), 0, it);
    const others = rows.value.filter((r) => !next.includes(r));
    rows.value = next[0]?.kind === "socket" ? [...next, ...others] : [...others, ...next];
  },
});
</script>

<template>
  <div class="wp-kit__stack">
    <p class="wp-kit__caption">Drag a row: sockets stay among sockets, text among text.</p>
    <div ref="list" class="wp-kit__stack" style="gap: 4px;" @dragover="drag.over" @drop="drag.drop">
      <!-- A demo of the drag alone; a real list also gives keyboard moves. -->
      <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
      <div
        v-for="r in rows"
        :key="r.id"
        class="wp-kit__row wp-demo-rowdrag"
        :class="drag.classes(r.id)"
        :style="drag.lineStyle(r.id)"
        :data-drag-key="r.id"
        :data-kind="r.kind"
        draggable="true"
        @dragstart="drag.start($event, r.id)"
        @dragend="drag.end"
      >
        <i class="pi pi-bars" aria-hidden="true" />
        <span style="flex: 1; font-family: var(--wp-font-mono);">{{ r.name }}</span>
        <span class="wp-kit__muted">{{ r.kind }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped src="@kit/row-drag.css"></style>
<style scoped>
.wp-demo-rowdrag {
  padding: 6px 8px; border: 1px solid var(--wp-border); border-radius: var(--wp-radius);
  background: var(--wp-bg-1); color: var(--wp-text); font-size: var(--wp-text-sm); cursor: grab;
}
</style>
