<script setup lang="ts">
import { computed } from 'vue';
import type { FieldEmits, FormFieldProps } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const props = defineProps<FormFieldProps>();
const emit = defineEmits<FieldEmits>();
const { inputId, control } = useField(props, emit);
const selected = computed(() => (Array.isArray(props.modelValue) ? (props.modelValue as (string | number)[]) : []));

function handleToggle(optValue: string) {
  const next = selected.value.includes(optValue) ? selected.value.filter((v) => v !== optValue) : [...selected.value, optValue];
  emit('update:modelValue', next);
}
</script>

<template>
  <FieldShell :id="props.id" :field="props.field" :error="props.error" variant="multiselect">
    <div
      v-for="(option, index) in (props.field.options ?? [])"
      :key="String(option.value)"
      class="fh-field__multiselect-option"
    >
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
    </div>
  </FieldShell>
</template>
