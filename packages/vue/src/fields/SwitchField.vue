<script setup lang="ts">
import type { FieldEmits, FormFieldProps } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const props = defineProps<FormFieldProps>();
const emit = defineEmits<FieldEmits>();
const { input } = useField(props, emit);
</script>

<template>
  <FieldShell :field="props.field" :error="props.error" variant="switch">
    <input
      v-bind="input"
      class="fh-field__switch"
      type="checkbox"
      role="switch"
      :checked="!!props.value"
      @change="(e) => emit('update:value', (e.target as HTMLInputElement).checked)"
    />
  </FieldShell>
</template>
