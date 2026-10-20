<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '../props';
import { fieldIds } from './useField';

const props = defineProps(fieldComponentProps);
defineEmits(fieldComponentEmits);
</script>

<template>
  <input type="hidden" :id="fieldIds(props.field, props.id).inputId" :name="props.field.key" :value="String(props.modelValue ?? '')" />
</template>
