<script setup lang="ts">
import type { FormField } from '@formhaus/core';
import { computed } from 'vue';
import FieldResolver from './FieldResolver.vue';
import { withDefaultFields } from './constants';
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

const components = computed(() => withDefaultFields(props.components));
</script>

<template>
  <FieldResolver
    v-bind="props"
    :components="components"
    @update:value="(v: unknown) => emit('update:value', v)"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
</template>
