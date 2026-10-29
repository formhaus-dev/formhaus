<script setup lang="ts">
import { builtInFields } from '@formhaus/core/internal';
import { type Component, computed } from 'vue';
import { fieldComponentEmits } from './props';
import { fieldResolverProps } from './innerProps';

const props = defineProps(fieldResolverProps);
const emit = defineEmits(fieldComponentEmits);

let development = false;
try {
  if (process.env.NODE_ENV !== 'production') development = true;
} catch {}
const fieldComponent = computed<Component | null>(() => props.components?.[props.field.type] ?? null);
const builtIn = computed(() => !!fieldComponent.value && builtInFields.has(fieldComponent.value));
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
    :loading="props.loading || (!builtIn && props.busy)"
    v-bind="builtIn && props.busy ? { 'aria-busy': 'true' } : {}"
    :disabled="props.disabled"
    :test-id="declares('testId') ? props.testId : undefined"
    :option-test-id="declares('optionTestId') ? props.optionTestId : undefined"
    :matrix="declares('matrix') ? props.matrix : undefined"
    :reveals="declares('reveals') ? props.reveals : undefined"
    @update:model-value="(v: unknown) => emit('update:modelValue', v)"
    @commit="(v: unknown) => emit('commit', v)"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
  <div v-else class="fh-field--unsupported">
    Unsupported field type{{ development ? `: ${props.field.type}` : '' }}
  </div>
</template>
