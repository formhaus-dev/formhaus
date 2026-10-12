<script setup lang="ts">
import { type Component, computed } from 'vue';
import type { CommitFieldEmits, FieldResolverProps } from './types';

const props = defineProps<FieldResolverProps>();
const emit = defineEmits<CommitFieldEmits>();

const fieldComponent = computed<Component | null>(() => props.components?.[props.field.type] ?? null);
</script>

<template>
  <component
    :is="fieldComponent"
    v-if="fieldComponent"
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
    Unsupported field type: {{ props.field.type }}
  </div>
</template>
