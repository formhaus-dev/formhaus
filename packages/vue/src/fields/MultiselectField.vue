<script setup lang="ts">
import { computed } from 'vue';
import type { FormFieldProps } from '../types';

const props = defineProps<FormFieldProps>();
const emit = defineEmits<{
  (e: 'update:value', value: unknown): void;
  (e: 'blur'): void;
}>();

const groupId = computed(() => `fh-field-${props.field.key}`);
const helperId = computed(() => `fh-field-${props.field.key}-helper`);
const selected = computed(() =>
  Array.isArray(props.value) ? (props.value as (string | number)[]) : [],
);

function handleToggle(optValue: string) {
  const next = selected.value.includes(optValue)
    ? selected.value.filter((v) => v !== optValue)
    : [...selected.value, optValue];
  emit('update:value', next);
}
</script>

<template>
  <fieldset
    class="fh-field fh-field--multiselect"
    :aria-invalid="!!props.error || undefined"
    :aria-describedby="(props.error || props.field.helperText) ? helperId : undefined"
  >
    <legend v-if="props.field.label" class="fh-field__label">
      {{ props.field.label }}
    </legend>
    <div class="fh-field__multiselect-group">
      <div
        v-for="option in (props.field.options ?? [])"
        :key="String(option.value)"
        class="fh-field__multiselect-option"
      >
        <input
          :id="`${groupId}-${option.value}`"
          class="fh-field__checkbox"
          type="checkbox"
          :checked="selected.includes(option.value)"
          :disabled="props.disabled || props.loading"
          @change="handleToggle(option.value)"
          @blur="emit('blur')"
        />
        <label :for="`${groupId}-${option.value}`" class="fh-field__multiselect-label">
          {{ option.label }}
        </label>
      </div>
    </div>
    <p v-if="props.error" :id="helperId" class="fh-field__error">{{ props.error }}</p>
    <p v-else-if="props.field.helperText" :id="helperId" class="fh-field__helper">{{ props.field.helperText }}</p>
  </fieldset>
</template>
