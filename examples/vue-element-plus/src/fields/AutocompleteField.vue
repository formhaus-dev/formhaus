<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import { ElAutocomplete } from 'element-plus';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const options = computed(() => props.field.options ?? []);
const text = computed(() => {
  const value = typeof props.modelValue === 'string' ? props.modelValue : '';
  return options.value.find((option) => option.value === value)?.label ?? value;
});

function suggest(query: string, show: (items: { value: string }[]) => void) {
  const term = query.trim().toLowerCase();
  show(options.value.filter((option) => option.label.toLowerCase().includes(term)).map((option) => ({ value: option.label })));
}

function update(next: string | number) {
  const typed = String(next);
  emit('update:modelValue', options.value.find((option) => option.label.toLowerCase() === typed.toLowerCase())?.value ?? typed);
}
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error">
    <ElAutocomplete
      :id="id"
      :name="field.key"
      :model-value="text"
      :fetch-suggestions="suggest"
      :placeholder="field.placeholder"
      :autocomplete="field.autocomplete ?? 'off'"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy(id, field, error)"
      :disabled="disabled || loading"
      :validate-event="false"
      :data-testid="testId"
      clearable
      class="field__control"
      @update:model-value="update"
      @blur="emit('blur')"
      @focus="emit('focus')"
    />
  </FieldShell>
</template>
