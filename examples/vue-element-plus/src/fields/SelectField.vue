<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import { ElOption, ElSelect } from 'element-plus';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const multiple = computed(() => props.field.type === 'multiselect');
const value = computed(() => (multiple.value ? (Array.isArray(props.modelValue) ? props.modelValue : []) : (props.modelValue ?? '')));
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error">
    <ElSelect
      :id="id"
      :name="field.key"
      :model-value="value"
      :multiple="multiple"
      :placeholder="field.placeholder ?? (multiple ? 'Select options' : 'Select an option')"
      :clearable="!field.validation?.required"
      :loading="loading"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy(id, field, error)"
      :disabled="disabled || loading"
      :validate-event="false"
      :data-testid="testId"
      @update:model-value="emit('update:modelValue', $event ?? (multiple ? [] : ''))"
      @blur="emit('blur')"
      @focus="emit('focus')"
    >
      <ElOption v-for="option in field.options ?? []" :key="option.value" :label="option.label" :value="option.value" />
    </ElSelect>
  </FieldShell>
</template>
