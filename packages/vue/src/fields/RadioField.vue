<script setup lang="ts">
import { computed } from 'vue';
import type { FormFieldProps } from '../types';

const props = defineProps<FormFieldProps>();
const emit = defineEmits<{
  (e: 'update:value', value: unknown): void;
  (e: 'commit', value: unknown): void;
  (e: 'blur'): void;
  (e: 'focus'): void;
}>();

let arrowSelection = false;
function onKeyDown(event: KeyboardEvent, value: string) {
  arrowSelection = event.key.startsWith('Arrow');
  if (props.field.autoAdvance && event.key === ' ') event.preventDefault();
  if (props.field.autoAdvance && event.key === 'Enter') {
    event.preventDefault();
    if (!event.repeat) emit('commit', value);
  }
}
function onClick(event: MouseEvent, value: string) {
  if (!props.field.autoAdvance || arrowSelection) return;
  if (event.detail > 1) event.preventDefault();
  else emit('commit', value);
}
function onKeyUp(event: KeyboardEvent, value: string) {
  arrowSelection = false;
  if (props.field.autoAdvance && event.key === ' ') { event.preventDefault(); emit('commit', value); }
}
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
          @blur="emit('blur')"
          @keydown="onKeyDown($event, option.value)"
          @keyup="onKeyUp($event, option.value)"
          @pointerdown="arrowSelection = false"
          @click="onClick($event, option.value)"
          @change="() => { if (!props.field.autoAdvance || arrowSelection) emit('update:value', option.value); }"
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
