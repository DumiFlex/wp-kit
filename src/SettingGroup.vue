<script setup lang="ts">
/**
 * SettingGroup: a titled block of SettingRows in one bordered panel, the
 * rows split by hairlines, so a long settings page reads as a list rather
 * than a stack of cards.
 *
 *   <SettingGroup title="Content" note="Applies to this browser.">
 *     <SettingRow label="Show NSFW posts" hint="Off by default."><WpSwitch v-model="nsfw" size="md" /></SettingRow>
 *   </SettingGroup>
 *
 * `#title-extra` sits after the title (a Badge, a help link). The panel is a
 * size container: its rows go to one column when it is narrower than 480px.
 */
defineProps<{
  title?: string | undefined;
  /** A line under the title. */
  note?: string | undefined;
}>();
</script>

<template>
  <section class="wp-set-group">
    <h3 v-if="title" class="wp-set-group__title">
      {{ title }}<slot name="title-extra" />
    </h3>
    <p v-if="note" class="wp-set-group__note">{{ note }}</p>
    <div class="wp-set-group__panel">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.wp-set-group { margin-bottom: var(--wp-space-7); }
.wp-set-group__title {
  display: flex;
  align-items: center;
  gap: var(--wp-space-3);
  margin: 0 0 var(--wp-space-3);
  font-size: var(--wp-text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--wp-text-dim);
}
.wp-set-group__note {
  margin: 0 0 var(--wp-space-3);
  font-size: var(--wp-text-sm);
  color: var(--wp-text-dim);
}
.wp-set-group__panel {
  container: wp-set-group / inline-size;
  background: var(--wp-bg-2);
  border: 1px solid var(--wp-border);
  border-radius: var(--wp-radius-lg);
}
</style>
