<script setup lang="ts">
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
const toValue = (value: string) => props.field.options?.[texts.value.indexOf(value)]?.value ?? value;
const shown = computed(() => {
  const stored = (props.modelValue as string) ?? '';
  const index = props.field.options?.findIndex((opt) => opt.value === stored) ?? -1;
  return toValue(text.value) === stored ? text.value : index < 0 ? stored : texts.value[index];
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
