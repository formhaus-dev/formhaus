<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '../props';
import FieldShell from './FieldShell.vue';
import OptionImage from './OptionImage.vue';
import { useChoice, useField } from './useField';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const { inputId, control } = useField(props, emit);
const choice = useChoice(props, emit);
</script>

<template>
  <FieldShell :id="props.id" :field="props.field" :error="props.error" variant="radio">
    <div
      v-for="(option, index) in (props.field.options ?? [])"
      :key="String(option.value)"
      class="fh-field__radio-option"
    >
      <input
        v-bind="{ ...control, ...choice(option.value) }"
        :autocomplete="props.field.autocomplete"
        :id="`${inputId}-${index}`"
        class="fh-field__radio"
        type="radio"
        :name="props.field.key"
        :value="option.value"
        :checked="String(props.modelValue) === String(option.value)"
      />
      <label :for="`${inputId}-${index}`" class="fh-field__radio-label">
        {{ option.label }}
      </label>
      <OptionImage :option="option" />
    </div>
  </FieldShell>
</template>
