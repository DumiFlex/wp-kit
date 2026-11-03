<script setup lang="ts">
import { ref } from "vue";
import Button from "@kit/Button.vue";
import Checkbox from "@kit/Checkbox.vue";
import SelectionBar from "@kit/SelectionBar.vue";

const rows = ["Blonde", "Auburn", "Silver", "Teal"];
const picked = ref(new Set<string>(["Auburn", "Silver"]));
const dm = ref(false);
function flip(r: string): void {
  const next = new Set(picked.value);
  if (next.has(r)) next.delete(r); else next.add(r);
  picked.value = next;
}
</script>

<template>
  <div class="wp-kit__stack wp-kit__stack--wide">
    <SelectionBar v-if="picked.size" :count="picked.size" noun="options" @clear="picked = new Set()">
      <Button size="sm" variant="ghost" icon="tag">Apply tag</Button>
      <Button size="sm" variant="danger" icon="trash">Delete</Button>
    </SelectionBar>
    <p v-else class="wp-kit__caption">Tick a row to show the bar.</p>
    <Checkbox v-for="r in rows" :key="r" :model-value="picked.has(r)" :label="r" @update:model-value="flip(r)" />
    <p class="wp-kit__caption">With an option after the count (#start)</p>
    <SelectionBar :count="3">
      <template #start><Checkbox v-model="dm" label="DM each reporter" /></template>
      <Button size="sm" variant="outline">Dismiss</Button>
      <Button size="sm" variant="danger">Delete posts</Button>
    </SelectionBar>
  </div>
</template>
