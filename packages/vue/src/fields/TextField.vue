<script setup lang="ts">
import { computed } from 'vue';
import type { FormFieldProps } from '../types';

const props = defineProps<FormFieldProps>();
const emit = defineEmits<{
  (e: 'update:value', value: unknown): void;
  (e: 'blur'): void;
}>();

const inputType = computed(() => {
  switch (props.field.type) {
    case 'email':
      return 'email';
    case 'phone':
      return 'tel';
    case 'number':
      return 'number';
    case 'password':
      return 'password';
    default:
      return 'text';
  }
});

const inputId = computed(() => `fh-field-${props.field.key}`);
const helperId = computed(() => `fh-field-${props.field.key}-helper`);

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  emit('update:value', props.field.type === 'number' ? Number(value) : value);
}
</script>

<template>
  <div class="fh-field">
    <label v-if="props.field.label" :for="inputId" class="fh-field__label">
      {{ props.field.label }}
    </label>
    <input
      :id="inputId"
      class="fh-field__input"
      :type="inputType"
      :value="String(props.value ?? '')"
      :placeholder="props.field.placeholder"
      :disabled="props.disabled || props.loading"
      :inputmode="props.field.inputMode"
      :aria-invalid="!!props.error || undefined"
      :aria-describedby="(props.error || props.field.helperText) ? helperId : undefined"
      @input="onInput"
      @blur="emit('blur')"
    />
    <p v-if="props.error" :id="helperId" class="fh-field__error">{{ props.error }}</p>
    <p v-else-if="props.field.helperText" :id="helperId" class="fh-field__helper">{{ props.field.helperText }}</p>
  </div>
</template>
