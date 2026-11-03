<script setup lang="ts">
import { ref } from "vue";
import Button from "@kit/Button.vue";
import Select from "@kit/Select.vue";
import SettingGroup from "@kit/SettingGroup.vue";
import SettingRow from "@kit/SettingRow.vue";
import WpSwitch from "@kit/WpSwitch.vue";

const nsfw = ref(false);
const compact = ref(true);
const keep = ref("7");
const target = ref(false);
function flash(): void {
  target.value = false;
  requestAnimationFrame(() => { target.value = true; });
}
</script>

<template>
  <div class="wp-kit__stack wp-kit__stack--wide">
    <SettingGroup title="Content" note="Saved in this browser.">
      <SettingRow label="Include NSFW posts" hint="Off by default." for="demo-nsfw" recommended="Off">
        <WpSwitch id="demo-nsfw" v-model="nsfw" size="md" aria-label="Include NSFW posts" />
      </SettingRow>
      <SettingRow label="Compact density" hint="Tighter rows and chips." setting-key="demo-density" :highlighted="target">
        <WpSwitch v-model="compact" size="md" aria-label="Compact density" />
      </SettingRow>
      <SettingRow label="Backups to keep" hint="The newest are kept, older ones deleted.">
        <Select v-model="keep" :options="[{ value: '3', label: 'Last 3' }, { value: '7', label: 'Last 7' }, { value: '30', label: 'Last 30' }]" aria-label="Backups to keep" />
      </SettingRow>
    </SettingGroup>
    <Button size="sm" variant="ghost" icon="bolt" @click="flash">Flash the density row (a search hit)</Button>
  </div>
</template>
