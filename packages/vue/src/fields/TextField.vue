<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FieldEmits, FormFieldProps } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const props = defineProps<FormFieldProps>();
const emit = defineEmits<FieldEmits>();
const { input } = useField(props, emit);

const inputType = computed(() => {
  switch (props.field.type) {
    case 'email':
      return 'email';
    case 'phone':
      return 'tel';
    case 'number':
      return 'number';
    case 'password':
      return 'password';
    default:
      return 'text';
  }
});

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
      :type="inputType"
      :value="text"
      :placeholder="props.field.placeholder ?? props.field.mask"
      :inputmode="props.field.inputMode"
      @input="onInput"
    />
  </FieldShell>
</template>
