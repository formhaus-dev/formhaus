<script setup lang="ts">
import { type Component, computed } from 'vue';
import { fieldComponentEmits } from './props';
import type { FieldResolverProps } from './types';

const props = defineProps<FieldResolverProps>();
const emit = defineEmits(fieldComponentEmits);

let development = false;
try {
  if (process.env.NODE_ENV !== 'production') development = true;
} catch {}
const fieldComponent = computed<Component | null>(() => props.components?.[props.field.type] ?? null);
const declares = (name: string) => {
  const declared = (fieldComponent.value as { props?: string[] | Record<string, unknown> } | null)?.props;
  return Array.isArray(declared) ? declared.includes(name) : !!declared && name in declared;
};
</script>

<template>
  <component
    :is="fieldComponent"
    v-if="fieldComponent"
    :id="props.id"
    :field="props.field"
    :model-value="props.modelValue"
    :error="props.error"
    :loading="props.loading"
    :disabled="props.disabled"
    :test-id="declares('testId') ? props.testId : undefined"
    :option-test-id="declares('optionTestId') ? props.optionTestId : undefined"
    @update:model-value="(v: unknown) => emit('update:modelValue', v)"
    @commit="(v: unknown) => emit('commit', v)"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
  <div v-else class="fh-field--unsupported">
    Unsupported field type{{ development ? `: ${props.field.type}` : '' }}
  </div>
</template>
