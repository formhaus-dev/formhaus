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
</script>

<template>
  <div class="fh-field">
    <label v-if="props.field.label" :for="inputId" class="fh-field__label">
      {{ props.field.label }}
    </label>
    <input
      :id="inputId"
      class="fh-field__input"
      type="date"
      :value="String(props.value ?? '')"
      :placeholder="props.field.placeholder"
      :disabled="props.disabled || props.loading"
      :aria-invalid="!!props.error || undefined"
      :aria-describedby="(props.error || props.field.helperText) ? helperId : undefined"
      @input="(e) => emit('update:value', (e.target as HTMLInputElement).value)"
      @blur="emit('blur')"
    />
    <p v-if="props.error" :id="helperId" class="fh-field__error">{{ props.error }}</p>
    <p v-else-if="props.field.helperText" :id="helperId" class="fh-field__helper">{{ props.field.helperText }}</p>
  </div>
</template>
