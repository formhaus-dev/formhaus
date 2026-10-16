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
    <select
      v-bind="input"
      class="fh-field__input fh-field__input--select"
      :value="String(props.modelValue ?? '')"
      @change="(e) => emit('update:modelValue', (e.target as HTMLSelectElement).value)"
    >
      <option v-if="props.field.placeholder" value="" disabled>
        {{ props.field.placeholder }}
      </option>
      <option v-for="(option, index) in (props.field.options ?? [])" :key="String(option.value)" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </FieldShell>
</template>
