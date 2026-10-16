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
  <FieldShell :id="props.id" :field="props.field" :error="props.error" variant="switch">
    <input
      v-bind="input"
      class="fh-field__switch"
      type="checkbox"
      role="switch"
      :checked="!!props.modelValue"
      @change="(e) => emit('update:modelValue', (e.target as HTMLInputElement).checked)"
    />
  </FieldShell>
</template>
