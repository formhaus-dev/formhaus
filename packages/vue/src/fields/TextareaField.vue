<script setup lang="ts">
import { fieldComponentProps } from '../props';
import type { FieldEmits } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const DEFAULT_ROWS = 3;

const props = defineProps(fieldComponentProps);
const emit = defineEmits<FieldEmits>();
const { input } = useField(props, emit);
</script>

<template>
  <FieldShell :id="props.id" :field="props.field" :error="props.error">
    <textarea
      v-bind="input"
      class="fh-field__input fh-field__input--textarea"
      :value="String(props.modelValue ?? '')"
      :placeholder="props.field.placeholder"
      :rows="props.field.rows ?? DEFAULT_ROWS"
      @input="(e) => emit('update:modelValue', (e.target as HTMLTextAreaElement).value)"
    />
  </FieldShell>
</template>
