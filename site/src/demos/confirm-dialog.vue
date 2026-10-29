<script setup lang="ts">
import { ref } from "vue";
import WpButton from "@kit/WpButton.vue";
import ConfirmDialog from "@kit/ConfirmDialog.vue";

const ask = ref<"delete" | "save" | null>(null);
</script>

<template>
  <WpButton variant="danger" icon="pi-trash" @click="ask = 'delete'">Reset overrides</WpButton>
  <WpButton icon="pi-save" @click="ask = 'save'">Save to library</WpButton>
  <ConfirmDialog
    :visible="ask === 'delete'"
    title="Reset this node's overrides?"
    body="Its options go back to the library's. Enter confirms, Escape cancels."
    confirm-label="Reset"
    variant="danger"
    @confirm="ask = null"
    @cancel="ask = null"
  />
  <ConfirmDialog
    :visible="ask === 'save'"
    title="Save Hair colour to the library?"
    confirm-label="Save"
    @confirm="ask = null"
    @cancel="ask = null"
  />
</template>
