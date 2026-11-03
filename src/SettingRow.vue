<script setup lang="ts">
/**
 * SettingRow: one setting, its label and hint on the left and its control on
 * the right. Put it in a SettingGroup.
 *
 *   <SettingRow label="Compact density" hint="Tighter rows and chips." for="density">
 *     <WpSwitch id="density" v-model="compact" size="md" />
 *   </SettingRow>
 *
 * `setting-key` is the row's id, so a settings search can jump to `#key`;
 * `highlighted` flashes the row once (the app sets it when that hash is the
 * target). `stacked` puts the control under the text, for a wide control (a
 * colour picker, a path list); `form` lines rows up as a label column and a
 * control column, like a form. `recommended` names the value most people
 * should pick ("On"). `for` makes the label a real `<label for>`. Slots:
 * `#badge` after the label, `#extra` under the hint (a status line).
 */
const props = defineProps<{
  label: string;
  hint?: string | undefined;
  settingKey?: string | undefined;
  /** Flash the row once, as the target of a search or a link. */
  highlighted?: boolean | undefined;
  stacked?: boolean | undefined;
  form?: boolean | undefined;
  /** The control's id, so the label is a real <label for>. */
  for?: string | undefined;
  recommended?: string | undefined;
}>();
</script>

<template>
  <div
    :id="settingKey"
    class="wp-set-row"
    :class="{ 'wp-set-row--stacked': stacked, 'wp-set-row--form': form, 'wp-set-row--target': highlighted }"
    :data-setting="settingKey"
  >
    <div class="wp-set-row__text">
      <label v-if="props.for" class="wp-set-row__label" :for="props.for">{{ label }}<slot name="badge" /></label>
      <span v-else class="wp-set-row__label">{{ label }}<slot name="badge" /></span>
      <p v-if="hint" class="wp-set-row__hint">{{ hint }}</p>
      <p v-if="recommended" class="wp-set-row__rec" data-test="setting-recommended">Recommended: {{ recommended }}</p>
      <slot name="extra" />
    </div>
    <div class="wp-set-row__control">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.wp-set-row {
  display: flex;
  align-items: center;
  gap: var(--wp-space-6);
  padding: var(--wp-space-5) var(--wp-space-6);
  border-top: 1px solid var(--wp-border);
  scroll-margin-top: 80px;
}
.wp-set-row:first-child { border-top: 0; }
.wp-set-row--stacked { flex-direction: column; align-items: stretch; gap: var(--wp-space-4); }
.wp-set-row--target { animation: wp-set-row-flash 1.6s ease-out 1; }
@keyframes wp-set-row-flash {
  0%, 30% { background: color-mix(in oklab, var(--wp-accent-500) 18%, transparent); }
  100% { background: transparent; }
}
.wp-set-row__text { flex: 1; min-width: 0; }
.wp-set-row__label {
  display: flex;
  align-items: center;
  gap: var(--wp-space-3);
  font-size: var(--wp-text-sm);
  font-weight: 600;
  color: var(--wp-text);
}
.wp-set-row__hint {
  margin: 3px 0 0;
  font-size: var(--wp-text-sm);
  line-height: 1.45;
  color: var(--wp-text-dim);
}
.wp-set-row__rec {
  margin: 3px 0 0;
  font-size: var(--wp-text-sm);
  color: var(--wp-accent-300);
}
.wp-set-row__control {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--wp-space-4);
  max-width: 55%;
  /* A long status next to a button wraps instead of pushing it out. */
  flex-wrap: wrap;
  justify-content: flex-end;
}
.wp-set-row--stacked .wp-set-row__control { max-width: none; justify-content: flex-start; }
.wp-set-row__control :deep(.wp-select) { min-width: 200px; }
.wp-set-row--form {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  column-gap: var(--wp-space-6);
  row-gap: 4px;
  align-items: center;
  padding: var(--wp-space-4) var(--wp-space-6);
}
.wp-set-row--form .wp-set-row__text { display: contents; }
.wp-set-row--form .wp-set-row__label { grid-column: 1; grid-row: 1; font-weight: 500; color: var(--wp-text-muted); }
.wp-set-row--form .wp-set-row__control { grid-column: 2; grid-row: 1; max-width: none; justify-content: flex-start; }
.wp-set-row--form .wp-set-row__hint { grid-column: 2; grid-row: 2; margin: 0; }
.wp-set-row--form .wp-set-row__rec { grid-column: 2; grid-row: 3; margin: 0; }
.wp-set-row--form :deep(.wp-set-row__extra) { grid-column: 1 / -1; }
/* A narrow group (a phone, a page beside the chat) puts every row in one column. */
@container wp-set-group (max-width: 480px) {
  .wp-set-row { flex-direction: column; align-items: stretch; }
  .wp-set-row__control { max-width: none; justify-content: flex-start; }
  .wp-set-row--form { grid-template-columns: minmax(0, 1fr); }
  .wp-set-row--form .wp-set-row__label,
  .wp-set-row--form .wp-set-row__control,
  .wp-set-row--form .wp-set-row__hint,
  .wp-set-row--form .wp-set-row__rec { grid-column: 1; grid-row: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .wp-set-row--target { animation: none; outline: 2px solid var(--wp-accent); outline-offset: -2px; }
}
</style>
