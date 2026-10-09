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
    <select
      v-bind="input"
      class="fh-field__input"
      :value="String(props.value ?? '')"
      @change="(e) => emit('update:value', (e.target as HTMLSelectElement).value)"
    >
      <option v-if="props.field.placeholder" value="" disabled>
        {{ props.field.placeholder }}
      </option>
      <option v-for="option in (props.field.options ?? [])" :key="String(option.value)" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </FieldShell>
</template>
