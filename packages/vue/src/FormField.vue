<script setup lang="ts">
import type { FormField } from '@formhaus/core';
import { type Component, computed } from 'vue';
import { defaultFieldComponents } from './constants';
import type { FieldComponentMap } from './types';

const props = defineProps<{
  field: FormField;
  value: unknown;
  error?: string;
  loading?: boolean;
  disabled?: boolean;
  components?: Partial<FieldComponentMap>;
}>();

const emit = defineEmits<{
  (e: 'update:value', value: unknown): void;
  (e: 'blur'): void;
  (e: 'focus'): void;
}>();

const fieldComponent = computed<Component | null>(() => {
  const custom = props.components?.[props.field.type];
  if (custom) return custom;
  return (defaultFieldComponents as Record<string, Component>)[props.field.type] ?? null;
});
</script>

<template>
  <component
    :is="fieldComponent"
    v-if="fieldComponent"
    :field="props.field"
    :value="props.value"
    :error="props.error"
    :loading="props.loading"
    :disabled="props.disabled"
    @update:value="(v: unknown) => emit('update:value', v)"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
  <div v-else class="fh-field--unsupported">
    Unsupported field type: {{ props.field.type }}
  </div>
</template>
