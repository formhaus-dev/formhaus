<script setup lang="ts">
import { inputType } from '@formhaus/core/fields';
import { computed, ref } from 'vue';
import { fieldComponentProps } from '../props';
import type { FieldEmits } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const props = defineProps(fieldComponentProps);
const emit = defineEmits<FieldEmits>();
const { input } = useField(props, emit);

const draft = ref('');
const text = computed(() =>
  props.field.type === 'number' && draft.value && Object.is(Number(draft.value), props.modelValue)
    ? draft.value
    : String(props.modelValue ?? ''),
);

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  draft.value = value;
  emit('update:modelValue', props.field.type !== 'number' ? value : value === '' ? null : Number(value));
}
</script>

<template>
  <FieldShell :id="props.id" :field="props.field" :error="props.error">
    <input
      v-bind="input"
      class="fh-field__input"
      :type="inputType(props.field)"
      :value="text"
      :placeholder="props.field.placeholder ?? props.field.mask"
      :inputmode="props.field.inputMode"
      @input="onInput"
    />
  </FieldShell>
</template>
