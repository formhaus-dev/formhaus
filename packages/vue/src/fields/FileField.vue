<script setup lang="ts">
import { fieldComponentProps } from '../props';
import type { FieldEmits } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const props = defineProps(fieldComponentProps);
const emit = defineEmits<FieldEmits>();
const { input } = useField(props, emit);

function onFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  emit('update:modelValue', files && files.length > 0 ? files[0] : null);
}
</script>

<template>
  <FieldShell :id="props.id" :field="props.field" :error="props.error">
    <input v-bind="input" class="fh-field__input" type="file" :accept="props.field.accept" @change="onFileChange" />
  </FieldShell>
</template>
