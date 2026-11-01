<script setup lang="ts">
import { optionAttrs } from '@formhaus/core/fields';
import { withReveals } from '@formhaus/core/internal';
import { fieldComponentEmits, fieldComponentProps } from '../props';
import FieldShell from './FieldShell.vue';
import OptionDescription from './OptionDescription.vue';
import OptionImage from './OptionImage.vue';
import RevealSlot from './RevealSlot.vue';
import { useChoice, useField } from './useField';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const { inputId, control } = useField(props, emit);
const choice = useChoice(props, emit);
</script>

<template>
  <FieldShell :id="props.id" :field="props.field" :error="props.error" :test-id="props.testId" :error-first="!!props.reveals" variant="radio">
    <template v-for="(option, index) in withReveals(props.field.options ?? [], props.reveals)" :key="String(option.value)">
      <div class="fh-field__radio-option">
        <input
          v-bind="{ ...control, ...optionAttrs(option, `${inputId}-${index}`, control.disabled), ...choice(option.value) }"
          :autocomplete="props.field.autocomplete"
          :id="`${inputId}-${index}`"
          class="fh-field__radio"
          :data-testid="props.optionTestId?.(String(option.value))"
          type="radio"
          :name="props.field.key"
          :value="option.value"
          :checked="String(props.modelValue) === String(option.value)"
          :aria-controls="option.reveal?.id"
        />
        <label :for="`${inputId}-${index}`" class="fh-field__radio-label">
          {{ option.label }}
        </label>
        <OptionDescription :option="option" :id="`${inputId}-${index}`" />
        <OptionImage :option="option" />
      </div>
      <RevealSlot :reveal="option.reveal" />
    </template>
  </FieldShell>
</template>
