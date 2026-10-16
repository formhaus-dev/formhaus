<script setup lang="ts">
import { formFieldEmits } from '../props';
import type { FormFieldProps } from '../types';
import { fieldIds } from './useField';

const props = defineProps<FormFieldProps>();
defineEmits(formFieldEmits);
</script>

<template>
  <input type="hidden" :id="fieldIds(props.field, props.id).inputId" :name="props.field.key" :value="String(props.modelValue ?? '')" />
</template>
