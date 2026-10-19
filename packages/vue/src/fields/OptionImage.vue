<script setup lang="ts">
import type { FieldOption } from '@formhaus/core';
import { ref } from 'vue';

defineProps<{ option: FieldOption }>();
const dialog = ref<HTMLDialogElement>();
const trigger = ref<HTMLButtonElement>();
</script>

<template>
  <template v-if="option.image">
    <img class="fh-field__option-image" :src="option.image" alt="" loading="lazy" decoding="async" />
    <button
      ref="trigger"
      type="button"
      class="fh-field__option-zoom"
      :aria-label="`Enlarge image: ${option.label}`"
      aria-haspopup="dialog"
      @click.stop="dialog?.showModal()"
    />
    <dialog
      ref="dialog"
      class="fh-dialog fh-dialog--image"
      :aria-label="option.label"
      @close="trigger?.focus()"
      @click.self="dialog?.close()"
      @keydown.stop
    >
      <div class="fh-dialog__header">
        <p class="fh-dialog__title">{{ option.label }}</p>
        <button type="button" class="fh-dialog__close" aria-label="Close" @click="dialog?.close()" />
      </div>
      <img class="fh-dialog__image" :src="option.image" alt="" loading="lazy" />
    </dialog>
  </template>
</template>
