<script setup lang="ts">
import { confirmDialogComponentProps } from '@formhaus/vue';
import { ElButton, ElDialog } from 'element-plus';

defineProps(confirmDialogComponentProps);
</script>

<template>
  <ElDialog
    :id="id"
    :model-value="open"
    :title="title"
    width="min(420px, calc(100vw - 32px))"
    align-center
    append-to-body
    :aria-describedby="`${id}-description`"
    @update:model-value="(visible: boolean) => !visible && cancel()"
  >
    <p :id="`${id}-description`">{{ description }}</p>
    <template #footer>
      <ElButton autofocus @click="cancel">{{ cancelLabel }}</ElButton>
      <ElButton type="danger" @click="confirm">{{ confirmLabel }}</ElButton>
    </template>
  </ElDialog>
</template>
