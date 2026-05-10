<script setup lang="ts">
import { computed } from 'vue';
import type { FormFieldProps } from '../types';

const props = defineProps<FormFieldProps>();
const emit = defineEmits<{
  (e: 'update:value', value: unknown): void;
  (e: 'blur'): void;
  (e: 'focus'): void;
}>();

const inputId = computed(() => `fh-field-${props.field.key}`);
const listId = computed(() => `fh-field-${props.field.key}-list`);
const helperId = computed(() => `fh-field-${props.field.key}-helper`);
const options = computed(() => props.field.options ?? []);
</script>

<template>
  <div class="fh-field">
    <label v-if="props.field.label" :for="inputId" class="fh-field__label">
      {{ props.field.label }}
    </label>
    <input
      :id="inputId"
      class="fh-field__input"
      type="text"
      :list="listId"
      :value="(props.value as string) ?? ''"
      :placeholder="props.field.placeholder"
      :disabled="props.disabled || props.loading"
      :aria-invalid="!!props.error || undefined"
      :aria-describedby="(props.error || props.field.helperText) ? helperId : undefined"
      autocomplete="off"
      @input="(e) => emit('update:value', (e.target as HTMLInputElement).value)"
      @focus="emit('focus')"
      @blur="emit('blur')"
    />
    <datalist :id="listId">
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </datalist>
    <p v-if="props.error" :id="helperId" class="fh-field__error">{{ props.error }}</p>
    <p v-else-if="props.field.helperText" :id="helperId" class="fh-field__helper">{{ props.field.helperText }}</p>
  </div>
</template>
