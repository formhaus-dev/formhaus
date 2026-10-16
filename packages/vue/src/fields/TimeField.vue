<script setup lang="ts">
import { formFieldProps } from '../props';
import type { FieldEmits } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const props = defineProps(formFieldProps);
const emit = defineEmits<FieldEmits>();
const { input } = useField(props, emit);
</script>

<template>
  <FieldShell :id="props.id" :field="props.field" :error="props.error">
    <input
      v-bind="input"
      class="fh-field__input fh-field__input--time"
      type="time"
      :value="String(props.modelValue ?? '')"
      @input="(e) => emit('update:modelValue', (e.target as HTMLInputElement).value)"
    />
  </FieldShell>
</template>
