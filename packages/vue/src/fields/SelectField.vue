<script setup lang="ts">
import { computed } from 'vue';
import type { FormFieldProps } from '../types';

const props = defineProps<FormFieldProps>();
const emit = defineEmits<{
  (e: 'update:value', value: unknown): void;
  (e: 'blur'): void;
}>();

const inputId = computed(() => `fh-field-${props.field.key}`);
const helperId = computed(() => `fh-field-${props.field.key}-helper`);

function onChange(event: Event) {
  emit('update:value', (event.target as HTMLSelectElement).value);
}
</script>

<template>
  <div class="fh-field">
    <label v-if="props.field.label" :for="inputId" class="fh-field__label">
      {{ props.field.label }}
    </label>
    <select
      :id="inputId"
      class="fh-field__input"
      :value="String(props.value ?? '')"
      :disabled="props.disabled || props.loading"
      :aria-invalid="!!props.error || undefined"
      :aria-describedby="(props.error || props.field.helperText) ? helperId : undefined"
      @change="onChange"
    >
      <option v-if="props.field.placeholder" value="" disabled>
        {{ props.field.placeholder }}
      </option>
      <option
        v-for="option in (props.field.options ?? [])"
        :key="String(option.value)"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <p v-if="props.error" :id="helperId" class="fh-field__error">{{ props.error }}</p>
    <p v-else-if="props.field.helperText" :id="helperId" class="fh-field__helper">{{ props.field.helperText }}</p>
  </div>
</template>
