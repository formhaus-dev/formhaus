<script setup lang="ts">
import { formFieldProps } from '../props';
import type { FieldEmits } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const props = defineProps(formFieldProps);
const emit = defineEmits<FieldEmits>();
const { inputId, input } = useField(props, emit);
</script>

<template>
  <FieldShell :id="props.id" :field="props.field" :error="props.error">
    <input
      v-bind="input"
      class="fh-field__input"
      type="text"
      :list="`${inputId}-list`"
      :value="(props.modelValue as string) ?? ''"
      :placeholder="props.field.placeholder"
      autocomplete="off"
      @input="(e) => emit('update:modelValue', (e.target as HTMLInputElement).value)"
    />
    <datalist :id="`${inputId}-list`">
      <option v-for="opt in (props.field.options ?? [])" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </datalist>
  </FieldShell>
</template>
