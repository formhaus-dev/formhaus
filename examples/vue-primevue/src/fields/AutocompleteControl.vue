<script setup lang="ts">
import type { FieldOption } from '@formhaus/core';
import { optionText, optionValue } from '@formhaus/core/fields';
import AutoComplete, { type AutoCompleteCompleteEvent } from 'primevue/autocomplete';
import { ref } from 'vue';

defineOptions({ inheritAttrs: false });
const props = defineProps<{ id: string; modelValue: string; options: FieldOption[]; disabled?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const suggestions = ref<FieldOption[]>([]);

function search({ query }: AutoCompleteCompleteEvent) {
  const term = query.trim().toLowerCase();
  suggestions.value = props.options.filter((option) => option.label.toLowerCase().includes(term));
}

function update(next: string | FieldOption | null) {
  emit('update:modelValue', next && typeof next === 'object' ? next.value : optionValue(props.options, next ?? ''));
}
</script>

<template>
  <AutoComplete
    :input-id="id"
    :model-value="optionText(options, modelValue)"
    :suggestions="suggestions"
    option-label="label"
    :disabled="disabled"
    :invalid="!!$attrs['aria-invalid']"
    :pt="{ pcInputText: { root: $attrs } }"
    dropdown
    @complete="search"
    @update:model-value="update"
  />
</template>
