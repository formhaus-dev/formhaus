<script setup lang="ts">
import { dividerBefore } from '@formhaus/core/internal';
import { computed } from 'vue';
import { useLabel } from '../composables/useLabel';
import { fieldComponentProps } from '../props';
import type { FieldEmits } from '../types';
import FieldShell from './FieldShell.vue';
import OptionImage from './OptionImage.vue';
import { useField } from './useField';

const props = defineProps(fieldComponentProps);
const emit = defineEmits<FieldEmits>();
const { inputId, control } = useField(props, emit);
const text = useLabel();
const options = computed(() => props.field.options ?? []);
const selected = computed(() => (Array.isArray(props.modelValue) ? (props.modelValue as (string | number)[]) : []));

function handleToggle(optValue: string) {
  const next = selected.value.includes(optValue) ? selected.value.filter((v) => v !== optValue) : [...selected.value, optValue];
  emit('update:modelValue', next);
}
</script>

<template>
  <FieldShell :id="props.id" :field="props.field" :error="props.error" variant="multiselect">
    <template v-for="(option, index) in options" :key="String(option.value)">
      <div v-if="dividerBefore(props.field, options, index)" class="fh-field__option-divider">{{ text('or') }}</div>
      <div class="fh-field__multiselect-option">
        <input
          v-bind="control"
          :id="`${inputId}-${index}`"
          :name="props.field.key"
          class="fh-field__checkbox"
          type="checkbox"
          :checked="selected.includes(option.value)"
          @change="handleToggle(option.value)"
        />
        <label :for="`${inputId}-${index}`" class="fh-field__multiselect-label">
          {{ option.label }}
        </label>
        <OptionImage :option="option" />
      </div>
    </template>
  </FieldShell>
</template>
