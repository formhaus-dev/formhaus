<script setup lang="ts">
import type { FieldOption } from '@formhaus/core';
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import AutoComplete, { type AutoCompleteCompleteEvent } from 'primevue/autocomplete';
import { computed, ref } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const options = computed(() => props.field.options ?? []);
const suggestions = ref<FieldOption[]>([]);
const text = computed(() => {
  const value = typeof props.modelValue === 'string' ? props.modelValue : '';
  return options.value.find((option) => option.value === value)?.label ?? value;
});

function search(event: AutoCompleteCompleteEvent) {
  const query = event.query.trim().toLowerCase();
  suggestions.value = options.value.filter((option) => option.label.toLowerCase().includes(query));
}

function update(next: string | FieldOption | null) {
  if (next && typeof next === 'object') return emit('update:modelValue', next.value);
  const typed = next ?? '';
  emit('update:modelValue', options.value.find((option) => option.label.toLowerCase() === typed.toLowerCase())?.value ?? typed);
}
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error">
    <AutoComplete
      :input-id="id"
      :name="field.key"
      :model-value="text"
      :suggestions="suggestions"
      option-label="label"
      :placeholder="field.placeholder"
      :loading="loading"
      :invalid="!!error"
      :input-props="{
        autocomplete: field.autocomplete ?? 'off',
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy(id, field, error),
        'data-testid': testId,
      }"
      :disabled="disabled || loading"
      dropdown
      fluid
      @complete="search"
      @update:model-value="update"
      @blur="emit('blur')"
      @focus="emit('focus')"
    />
  </FieldShell>
</template>
