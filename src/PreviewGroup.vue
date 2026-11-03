<script setup lang="ts">
/**
 * One group of a preview table: a flush kit Disclosure with the group's
 * name, its count and a dim note at the right (a share, a summary). A group
 * with no name (the options outside any group) has no heading and is always
 * open, so the caller writes its body once for both.
 */
import Disclosure from "./Disclosure.vue";

withDefaults(defineProps<{
  name?: string | undefined;
  open: boolean;
  count?: number | string | undefined;
  aside?: string | undefined;
  /** `data-test` on the heading button. */
  testId?: string | undefined;
}>(), { name: "", count: undefined, aside: undefined, testId: undefined });

const emit = defineEmits<{ (e: "update:open", v: boolean): void }>();
</script>

<template>
  <Disclosure
    v-if="name"
    flush
    lazy
    class="wp-pv-group"
    :open="open"
    :trigger-attrs="testId ? { 'data-test': testId } : undefined"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <template #summary>
      <span class="wp-pv-group__name">{{ name }}</span>
      <span
        v-if="count !== undefined"
        class="wp-pv-group__count"
      >{{ count }}</span>
      <span
        v-if="aside"
        class="wp-pv-group__aside"
      >{{ aside }}</span>
    </template>
    <slot />
  </Disclosure>
  <div
    v-else
    class="wp-pv-group"
  >
    <slot />
  </div>
</template>

<style scoped>
.wp-pv-group__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wp-pv-group__count {
  padding: 0 7px;
  border-radius: var(--wp-radius-cap, 999px);
  background: var(--wp-bg-3);
  color: var(--wp-text-dim);
  font-family: var(--wp-font-mono);
  font-size: 11px;
  font-weight: 400;
}
.wp-pv-group__aside {
  margin-left: auto;
  color: var(--wp-text-dim);
  font-size: 11.5px;
  font-weight: 400;
}
</style>
