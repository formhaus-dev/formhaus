<script setup lang="ts">
import { type Component, computed } from 'vue';
import { formFieldEmits } from './props';
import type { FieldResolverProps } from './types';

const props = defineProps<FieldResolverProps>();
const emit = defineEmits(formFieldEmits);

let development = false;
try {
  if (process.env.NODE_ENV !== 'production') development = true;
} catch {}
const fieldComponent = computed<Component | null>(() => props.components?.[props.field.type] ?? null);
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
    @update:model-value="(v: unknown) => emit('update:modelValue', v)"
    @commit="(v: unknown) => emit('commit', v)"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
  <div v-else class="fh-field--unsupported">
    Unsupported field type{{ development ? `: ${props.field.type}` : '' }}
  </div>
</template>
