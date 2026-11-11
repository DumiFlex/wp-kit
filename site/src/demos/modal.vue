<script setup lang="ts">
import { ref } from "vue";
import Button from "@kit/Button.vue";
import Field from "@kit/Field.vue";
import Input from "@kit/Input.vue";
import Modal from "@kit/Modal.vue";

const name = ref("Hair colour");
const modalOpen = ref(false);
const editOpen = ref(false);
</script>

<template>
  <Button @click="modalOpen = true">Open a dialog</Button>
  <Modal v-model:open="modalOpen" title="Rename Hair colour" size="sm">
    <Field label="Name" for="kit-modal-name"><Input id="kit-modal-name" v-model="name" /></Field>
    <template #footer>
      <Button @click="modalOpen = false">Cancel</Button>
      <Button variant="primary" @click="modalOpen = false">Rename</Button>
    </template>
  </Modal>
  <Button @click="editOpen = true">Open an edit window</Button>
  <Modal v-model:open="editOpen" size="lg" accent="var(--wp-kind-wildcard, var(--wp-accent))" icon="sparkles">
    <template #header="{ titleId }">
      <div class="kit-modal-demo__titles">
        <span :id="titleId" class="kit-modal-demo__name">Hair colour</span>
        <span class="kit-modal-demo__chip">wildcard</span>
        <div class="kit-modal-demo__sub">The header takes the colour of what you edit.</div>
      </div>
    </template>
    <p>Body of the edit window.</p>
    <template #footer>
      <Button @click="editOpen = false">Cancel</Button>
      <Button variant="primary" @click="editOpen = false">Save</Button>
    </template>
  </Modal>
</template>

<style scoped>
.kit-modal-demo__titles { flex: 1; min-width: 0; }
.kit-modal-demo__name { font-weight: 600; font-size: 13px; }
.kit-modal-demo__chip {
  margin-left: 8px;
  padding: 2px 6px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-radius: min(2px, var(--wp-radius-cap, 999px));
  background: color-mix(in srgb, var(--wp-modal-accent) 22%, transparent);
  color: var(--wp-modal-accent);
}
.kit-modal-demo__sub { font-size: 11px; color: var(--wp-text-dim); margin-top: 3px; }
</style>
