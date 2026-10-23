<script setup lang="ts">
import { optionText, optionValue } from '@formhaus/core/fields';
import { optionTexts } from '@formhaus/core/internal';
import { computed, ref } from 'vue';
import { fieldComponentProps } from '../props';
import type { FieldEmits } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const props = defineProps(fieldComponentProps);
const emit = defineEmits<FieldEmits>();
const { inputId, input } = useField(props, emit);
const text = ref('');
const texts = computed(() => optionTexts(props.field.options ?? []));
const toValue = (value: string) => optionValue(props.field.options ?? [], value);
const shown = computed(() => {
  const stored = (props.modelValue as string) ?? '';
  return toValue(text.value) === stored ? text.value : optionText(props.field.options ?? [], stored);
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
      :autocomplete="props.field.autocomplete ?? 'off'"
      @input="onInput"
    />
    <datalist :id="`${inputId}-list`">
      <option v-for="text in texts" :key="text" :value="text" />
    </datalist>
  </FieldShell>
</template>
