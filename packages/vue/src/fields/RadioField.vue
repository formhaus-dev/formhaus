<script setup lang="ts">
import type { CommitFieldEmits, FormFieldProps } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const props = defineProps<FormFieldProps>();
const emit = defineEmits<CommitFieldEmits>();
const { inputId, control } = useField(props, emit);

let arrowSelection = false;
function onKeyDown(event: KeyboardEvent, value: string) {
  arrowSelection = event.key.startsWith('Arrow');
  if (props.field.autoAdvance && event.key === ' ') event.preventDefault();
  if (props.field.autoAdvance && event.key === 'Enter') {
    event.preventDefault();
    if (!event.repeat) emit('commit', value);
  }
}
function onClick(event: MouseEvent, value: string) {
  if (!props.field.autoAdvance || arrowSelection) return;
  if (event.detail > 1) event.preventDefault();
  else emit('commit', value);
}
function onKeyUp(event: KeyboardEvent, value: string) {
  arrowSelection = false;
  if (props.field.autoAdvance && event.key === ' ') { event.preventDefault(); emit('commit', value); }
}
</script>

<template>
  <FieldShell :field="props.field" :error="props.error" variant="radio">
    <div
      v-for="option in (props.field.options ?? [])"
      :key="String(option.value)"
      class="fh-field__radio-option"
    >
      <input
        v-bind="control"
        :id="`${inputId}-${option.value}`"
        class="fh-field__radio"
        type="radio"
        :name="props.field.key"
        :value="option.value"
        :checked="String(props.value) === String(option.value)"
        @keydown="onKeyDown($event, option.value)"
        @keyup="onKeyUp($event, option.value)"
        @pointerdown="arrowSelection = false"
        @click="onClick($event, option.value)"
        @change="() => { if (!props.field.autoAdvance || arrowSelection) emit('update:value', option.value); }"
      />
      <label :for="`${inputId}-${option.value}`" class="fh-field__radio-label">
        {{ option.label }}
      </label>
    </div>
  </FieldShell>
</template>
