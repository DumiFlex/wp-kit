<script setup lang="ts">
import CodeBlock from "@kit/CodeBlock.vue";

const json = `{
  "type": "wildcard",
  "name": "Hair colour",
  "options": [
    { "value": "auburn hair", "weight": 1, "tags": ["warm"] },
    { "value": "silver hair with a long fringe that falls over one eye and catches the rim light", "weight": 0.5 }
  ]
}`;
const vue = `<Chip :pressed="tag === t" :count="12" size="sm" @click="pick(t)">{{ t }}</Chip>
<!-- a filter chip -->`;
const ts = `import Chip from "@dumiflex/wp-kit/Chip.vue";
// The kind colour for a post's type
const color = kindColour(itemType(post.kind, post.subtype));`;
const sh = "pnpm add @dumiflex/wp-kit vue primeicons  # install\nnpm stage approve \"$ID\" --otp 123456";
const prompt = "$quality, {auburn|silver|ink black} hair, @{a1b2c3d4}, (rim light:1.2), $$5 tip";
const log = "POST /wp/api/ai/chat 200 1.8 s\nmodel qwen3.5-9b · 3,412 tokens in · 286 out\n\ntool search_library {\"query\": \"hair\"}\ntool test_stack {\"seeds\": 200}";
</script>

<template>
  <div class="wp-kit__stack wp-kit__stack--wide">
    <CodeBlock :code="json" language="JSON" title="Export" max-height="180px" />
    <CodeBlock :code="vue" language="Vue" />
    <CodeBlock :code="ts" language="TS" line-numbers />
    <CodeBlock :code="sh" language="Shell" />
    <CodeBlock :code="prompt" title="Template" syntax="prompt" default-wrap />
    <CodeBlock :code="log" title="Request (no language: plain)" line-numbers wrap />
    <div class="wp-kit__canvas">
      <p class="wp-kit__caption">Canvas, size sm, bare</p>
      <CodeBlock code="masterpiece, $subject, {soft|rim} light, (detailed:1.1)" syntax="prompt" size="sm" bare />
    </div>
  </div>
</template>
