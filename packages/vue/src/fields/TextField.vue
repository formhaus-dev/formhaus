<script setup lang="ts">
import { computed } from 'vue';
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

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  emit('update:value', props.field.type === 'number' && value !== '' ? Number(value) : value);
}
</script>

<template>
  <FieldShell :field="props.field" :error="props.error">
    <input
      v-bind="input"
      class="fh-field__input"
      :type="inputType"
      :value="String(props.value ?? '')"
      :placeholder="props.field.placeholder ?? props.field.mask"
      :inputmode="props.field.inputMode"
      @input="onInput"
    />
  </FieldShell>
</template>
