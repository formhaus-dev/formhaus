<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { confirmDialogComponentProps } from './props';

const props = defineProps(confirmDialogComponentProps);
const dialog = ref<HTMLDialogElement>();

function sync() {
  const element = dialog.value;
  if (!element || props.open === element.open) return;
  if (!props.open) element.close();
  else if (typeof element.showModal === 'function') element.showModal();
  else element.open = true;
  if (props.open) element.querySelector<HTMLElement>('.fh-dialog__cancel')?.focus();
}

onMounted(sync);
watch(() => props.open, sync);

function backdrop(event: MouseEvent) {
  if (event.target === event.currentTarget) props.cancel();
}
</script>

<template>
  <dialog ref="dialog" :id="id" class="fh-dialog" :aria-labelledby="`${id}-title`" :aria-describedby="`${id}-description`"
    @cancel.prevent="cancel" @keydown.esc.prevent="cancel" @click="backdrop">
    <div class="fh-dialog__header">
      <h2 :id="`${id}-title`" class="fh-dialog__title">{{ title }}</h2>
      <p :id="`${id}-description`" class="fh-dialog__description">{{ description }}</p>
      <button type="button" class="fh-dialog__close" :aria-label="cancelLabel" @click="cancel" />
    </div>
    <div class="fh-dialog__footer">
      <button type="button" class="fh-form-actions__button fh-form-actions__button--text fh-dialog__cancel" @click="cancel">{{ cancelLabel }}</button>
      <button type="button" class="fh-form-actions__button fh-dialog__danger" @click="confirm">{{ confirmLabel }}</button>
    </div>
  </dialog>
</template>
