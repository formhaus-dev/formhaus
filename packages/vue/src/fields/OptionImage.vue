<script setup lang="ts">
import { imageSource } from '@formhaus/core/internal';
import { computed, ref } from 'vue';
import { useLabel } from '../composables/useLabel';
import { optionImageProps } from '../innerProps';

const props = defineProps(optionImageProps);
const image = computed(() => imageSource(props.option.image));
const text = useLabel();
const dialog = ref<HTMLDialogElement>();
const trigger = ref<HTMLButtonElement>();
const failed = ref<string>();
let pressed: EventTarget | null = null;
const press = (event: Event) => {
  pressed = event.target;
};
const closeOnBackdrop = (event: Event) => pressed === event.target && dialog.value?.close();
</script>

<template>
  <span v-if="image && failed === image" class="fh-field__option-image" />
  <template v-else-if="image">
    <img
      class="fh-field__option-image"
      :src="image"
      alt=""
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      @error="failed = image"
    />
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
      @pointerdown="press"
      @click.self="closeOnBackdrop"
      @keydown.stop="dialog?.removeAttribute('data-pointer')"
    >
      <div class="fh-dialog__header">
        <p class="fh-dialog__title">{{ option.label }}</p>
        <button type="button" class="fh-dialog__close" :aria-label="text('close')" @click="dialog?.close()" />
      </div>
      <img class="fh-dialog__image" :src="image" alt="" loading="lazy" referrerpolicy="no-referrer" />
    </dialog>
  </template>
</template>
