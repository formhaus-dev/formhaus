<script setup lang="ts">
import type { FieldOption, LabelKey } from '@formhaus/core';
import { labelFor } from '@formhaus/core/internal';
import { inject, ref } from 'vue';

defineProps<{ option: FieldOption }>();
const text = inject('fhLabel', (key: LabelKey, params: Record<string, unknown> = {}) => labelFor(key, params));
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
      :aria-label="text('enlargeImage', { label: option.label })"
      aria-haspopup="dialog"
      @click.stop="dialog?.toggleAttribute('data-pointer', $event.detail > 0), dialog?.showModal()"
    />
    <dialog
      ref="dialog"
      class="fh-dialog fh-dialog--image"
      :aria-label="option.label"
      @close="trigger?.focus()"
      @click.self="dialog?.close()"
      @keydown.stop="dialog?.removeAttribute('data-pointer')"
    >
      <div class="fh-dialog__header">
        <p class="fh-dialog__title">{{ option.label }}</p>
        <button type="button" class="fh-dialog__close" :aria-label="text('close')" @click="dialog?.close()" />
      </div>
      <img class="fh-dialog__image" :src="option.image" alt="" loading="lazy" />
    </dialog>
  </template>
</template>
