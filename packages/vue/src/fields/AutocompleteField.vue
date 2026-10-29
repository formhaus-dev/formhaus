<script setup lang="ts">
import { freeText } from '@formhaus/core/fields';
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
const typed = computed(() =>
  freeText(props.field.options ?? [], props.modelValue, text.value, (value, input) => {
    text.value = input;
    emit('update:modelValue', value);
  }),
);
function onInput(event: Event) {
  typed.value.setText((event.target as HTMLInputElement).value);
}
</script>

<template>
  <FieldShell :id="props.id" :field="props.field" :error="props.error">
    <input
      v-bind="input"
      class="fh-field__input"
      type="text"
      :list="`${inputId}-list`"
      :value="typed.text"
      :placeholder="props.field.placeholder"
      :autocomplete="props.field.autocomplete ?? 'off'"
      @input="onInput"
    />
    <datalist :id="`${inputId}-list`">
      <option v-for="text in texts" :key="text" :value="text" />
    </datalist>
  </FieldShell>
</template>
