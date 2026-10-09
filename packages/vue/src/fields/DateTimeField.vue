<script setup lang="ts">
import type { FieldEmits, FormFieldProps } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const props = defineProps<FormFieldProps>();
const emit = defineEmits<FieldEmits>();
const { input } = useField(props, emit);
</script>

<template>
  <FieldShell :field="props.field" :error="props.error">
    <input
      v-bind="input"
      class="fh-field__input"
      type="datetime-local"
      :value="String(props.value ?? '')"
      :placeholder="props.field.placeholder"
      @input="(e) => emit('update:value', (e.target as HTMLInputElement).value)"
    />
  </FieldShell>
</template>
