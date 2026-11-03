<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

interface Props {
  modelValue: string;
  rows?: number | undefined;
  placeholder?: string | undefined;
  autoResize?: boolean | undefined;
  disabled?: boolean | undefined;
  error?: boolean | undefined;
  id?: string | undefined;
  ariaLabel?: string | undefined;
  /** Mono text: templates, tag lists. */
  mono?: boolean | undefined;
  /** "accent" marks a value changed from its default, "warn" one that needs a look. */
  tone?: "accent" | "warn" | undefined;
}
const props = withDefaults(defineProps<Props>(), { rows: 3 });

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "blur", evt: FocusEvent): void;
  (e: "focus", evt: FocusEvent): void;
}>();

const taRef = ref<HTMLTextAreaElement | null>(null);

function autosize() {
  if (!props.autoResize) return;
  const el = taRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function onInput(e: Event) {
  emit("update:modelValue", (e.target as HTMLTextAreaElement).value);
  if (props.autoResize) nextTick(autosize);
}

watch(() => props.modelValue, () => {
  if (props.autoResize) nextTick(autosize);
});
</script>

<template>
  <textarea
    :id="id"
    ref="taRef"
    class="wp-textarea"
    :data-mono="mono || undefined"
    :data-tone="tone"
    :rows="rows"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :aria-invalid="error || undefined"
    @input="onInput"
    @blur="(e) => emit('blur', e)"
    @focus="(e) => emit('focus', e)"
  />
</template>

<style scoped src="./input.css"></style>
