<script setup lang="ts">
import { ref } from "vue";
import Badge from "@kit/Badge.vue";
import ColorField from "@kit/ColorField.vue";
import Input from "@kit/Input.vue";
import SettingGroup from "@kit/SettingGroup.vue";
import SettingRow from "@kit/SettingRow.vue";

const name = ref("Hair colour");
const path = ref("/home/me/ComfyUI/user/wildcard-pipeline.db");
const colour = ref("#6366f1");
</script>

<template>
  <div class="wp-kit__stack wp-kit__stack--wide">
    <p class="wp-kit__caption">form: a label column and a control column</p>
    <SettingGroup>
      <SettingRow label="Name" form for="demo-name" hint="Shown in the library and on the canvas.">
        <Input id="demo-name" v-model="name" />
      </SettingRow>
      <SettingRow label="Colour" form>
        <ColorField v-model="colour" presets size="md" aria-label="Colour" />
      </SettingRow>
    </SettingGroup>
    <p class="wp-kit__caption">stacked: a wide control under the text, with a badge</p>
    <SettingGroup>
      <SettingRow label="Database file" hint="Where your library lives." stacked>
        <template #badge><Badge tone="success" text="current" /></template>
        <Input v-model="path" aria-label="Database file" />
      </SettingRow>
    </SettingGroup>
  </div>
</template>
