<script setup lang="ts">
import { confirmDialogComponentProps } from '@formhaus/vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

defineProps(confirmDialogComponentProps);
</script>

<template>
  <Dialog
    :id="id"
    :visible="open"
    :header="title"
    modal
    :draggable="false"
    :aria-describedby="`${id}-description`"
    class="dialog"
    @update:visible="(visible: boolean) => !visible && cancel()"
  >
    <p :id="`${id}-description`">{{ description }}</p>
    <template #footer>
      <Button :label="cancelLabel" severity="secondary" variant="text" autofocus @click="cancel" />
      <Button :label="confirmLabel" severity="danger" @click="confirm" />
    </template>
  </Dialog>
</template>
