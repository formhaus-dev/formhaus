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
  <div class="fh-field fh-field--checkbox">
    <div class="fh-field__checkbox-wrapper">
      <input
        :id="inputId"
        class="fh-field__checkbox"
        type="checkbox"
        :checked="!!props.value"
        :disabled="props.disabled || props.loading"
        :aria-invalid="!!props.error || undefined"
        :aria-describedby="(props.error || props.field.helperText) ? helperId : undefined"
        @change="(e) => emit('update:value', (e.target as HTMLInputElement).checked)"
      />
      <label v-if="props.field.label" :for="inputId" class="fh-field__label">
        {{ props.field.label }}
      </label>
    </div>
    <p v-if="props.error" :id="helperId" class="fh-field__error">{{ props.error }}</p>
    <p v-else-if="props.field.helperText" :id="helperId" class="fh-field__helper">{{ props.field.helperText }}</p>
  </div>
</template>
