<script setup lang="ts">
import { computed, ref } from 'vue';
import { formFieldProps } from '../props';
import type { FieldEmits } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const props = defineProps(formFieldProps);
const emit = defineEmits<FieldEmits>();
const { inputId, input } = useField(props, emit);
const text = ref('');
const toValue = (value: string) => props.field.options?.find((opt) => opt.label === value)?.value ?? value;
const shown = computed(() => {
  const stored = (props.modelValue as string) ?? '';
  return toValue(text.value) === stored ? text.value : (props.field.options?.find((opt) => opt.value === stored)?.label ?? stored);
});
function onInput(event: Event) {
  text.value = (event.target as HTMLInputElement).value;
  emit('update:modelValue', toValue(text.value));
}
</script>

<template>
  <FieldShell :id="props.id" :field="props.field" :error="props.error">
    <input
      v-bind="input"
      class="fh-field__input"
      type="text"
      :list="`${inputId}-list`"
      :value="shown"
      :placeholder="props.field.placeholder"
      autocomplete="off"
      @input="onInput"
    />
    <datalist :id="`${inputId}-list`">
      <option v-for="opt in props.field.options" :key="opt.value" :value="opt.label" />
    </datalist>
  </FieldShell>
</template>
