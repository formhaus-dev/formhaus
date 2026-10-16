<script setup lang="ts">
import { formFieldEmits } from '../props';
import { formFieldProps } from '../props';
import { fieldIds } from './useField';

const props = defineProps(formFieldProps);
defineEmits(formFieldEmits);
</script>

<template>
  <input type="hidden" :id="fieldIds(props.field, props.id).inputId" :name="props.field.key" :value="String(props.modelValue ?? '')" />
</template>
