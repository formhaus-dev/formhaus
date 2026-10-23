<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import MultiSelect from 'primevue/multiselect';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error">
    <MultiSelect
      :input-id="id"
      :name="field.key"
      :model-value="Array.isArray(modelValue) ? modelValue : []"
      :options="field.options ?? []"
      option-label="label"
      option-value="value"
      :placeholder="field.placeholder ?? 'Select options'"
      display="chip"
      :show-toggle-all="false"
      :loading="loading"
      :invalid="!!error"
      :pt="{ hiddenInput: { 'aria-describedby': describedBy(id, field, error), 'data-testid': testId } }"
      :disabled="disabled || loading"
      fluid
      @update:model-value="emit('update:modelValue', $event ?? [])"
      @blur="emit('blur')"
      @focus="emit('focus')"
    />
  </FieldShell>
</template>
