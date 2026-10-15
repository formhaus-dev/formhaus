<script setup lang="ts">
import type { CommitFieldEmits, FormFieldProps } from '../types';
import { fieldIds } from './useField';

const props = defineProps<FormFieldProps>();
defineEmits<CommitFieldEmits>();
</script>

<template>
  <input type="hidden" :id="fieldIds(props.field, props.id).inputId" :name="props.field.key" :value="String(props.modelValue ?? '')" />
</template>
