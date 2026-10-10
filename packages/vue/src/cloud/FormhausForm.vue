<script setup lang="ts">
import { computed } from 'vue';
import { FormRenderer } from '@formhaus/vue';
import type { FormhausFormProps } from './types';
import { useCloudForm } from './useCloudForm';

const props = defineProps<FormhausFormProps>();
const emit = defineEmits<{ success: [submission: { id: string; values: Record<string, unknown> }] }>();

const { state, submit } = useCloudForm({
  id: () => props.id,
  apiBase: () => props.apiBase,
  onSuccess: (submission) => emit('success', submission),
  onError: () => props.onError,
});

const rendererProps = computed(() => {
  const { id, apiBase, ...rest } = props;
  return rest;
});
</script>

<template>
  <p v-if="state.loadError" role="alert" class="fh-form__error">{{ state.loadError.message }}</p>
  <div v-else-if="!state.definition" class="fh-form" aria-busy="true"><slot name="fallback" /></div>
  <slot v-else-if="state.done" name="success">
    <p role="status" class="fh-form__success">Thank you. Your response was submitted.</p>
  </slot>
  <FormRenderer v-else v-bind="rendererProps" :definition="state.definition" :errors="state.errors" :submit-handler="submit" />
</template>
