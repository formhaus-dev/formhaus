<script setup lang="ts">
import { formFieldEmits, formFieldProps } from '@formhaus/vue';

const props = defineProps(formFieldProps);
const emit = defineEmits(formFieldEmits);
</script>

<template>
  <label :for="props.id">{{ props.field.label }}</label>
  <input
    :id="props.id"
    :value="String(props.modelValue ?? '')"
    :disabled="props.disabled"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    @blur="emit('blur')"
  />
</template>
