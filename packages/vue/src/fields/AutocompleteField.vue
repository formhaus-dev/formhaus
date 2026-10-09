<script setup lang="ts">
import type { FieldEmits, FormFieldProps } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const props = defineProps<FormFieldProps>();
const emit = defineEmits<FieldEmits>();
const { inputId, input } = useField(props, emit);
</script>

<template>
  <FieldShell :field="props.field" :error="props.error">
    <input
      v-bind="input"
      class="fh-field__input"
      type="text"
      :list="`${inputId}-list`"
      :value="(props.value as string) ?? ''"
      :placeholder="props.field.placeholder"
      autocomplete="off"
      @input="(e) => emit('update:value', (e.target as HTMLInputElement).value)"
    />
    <datalist :id="`${inputId}-list`">
      <option v-for="opt in (props.field.options ?? [])" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </datalist>
  </FieldShell>
</template>
