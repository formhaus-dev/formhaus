<script setup lang="ts">
import { computed } from 'vue';
import type { FormFieldProps } from '../types';

const props = defineProps<FormFieldProps>();
const emit = defineEmits<{
  (e: 'update:value', value: unknown): void;
  (e: 'blur'): void;
  (e: 'focus'): void;
}>();

const groupId = computed(() => `fh-field-${props.field.key}`);
const helperId = computed(() => `fh-field-${props.field.key}-helper`);
</script>

<template>
  <fieldset
    class="fh-field fh-field--radio"
    :aria-invalid="!!props.error || undefined"
    :aria-describedby="(props.error || props.field.helperText) ? helperId : undefined"
  >
    <legend v-if="props.field.label" class="fh-field__label">
      {{ props.field.label }}
    </legend>
    <div class="fh-field__radio-group">
      <div
        v-for="option in (props.field.options ?? [])"
        :key="String(option.value)"
        class="fh-field__radio-option"
      >
        <input
          :id="`${groupId}-${option.value}`"
          class="fh-field__radio"
          type="radio"
          :name="props.field.key"
          :value="option.value"
          :checked="String(props.value) === String(option.value)"
          :disabled="props.disabled || props.loading"
          @focus="emit('focus')"
          @change="emit('update:value', option.value)"
        />
        <label :for="`${groupId}-${option.value}`" class="fh-field__radio-label">
          {{ option.label }}
        </label>
      </div>
    </div>
    <p v-if="props.error" :id="helperId" class="fh-field__error">{{ props.error }}</p>
    <p v-else-if="props.field.helperText" :id="helperId" class="fh-field__helper">{{ props.field.helperText }}</p>
  </fieldset>
</template>
