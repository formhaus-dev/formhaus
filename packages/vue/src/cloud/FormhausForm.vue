<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { FormRenderer } from '@formhaus/vue';
import { CloudError, focusProblem, type CloudAction } from '@formhaus/core/cloud';
import CloudNotice from './CloudNotice.vue';
import type { FormhausFormProps } from './types';
import { useCloudForm } from './useCloudForm';

const props = defineProps<FormhausFormProps>();
const emit = defineEmits<{ success: [submission: { id: string; values: Record<string, unknown> }] }>();
const root = ref<HTMLDivElement | null>(null);
const notice = ref<InstanceType<typeof CloudNotice> | null>(null);

const { state, submit, retry } = useCloudForm({
  id: () => props.id,
  apiBase: () => props.apiBase,
  onSuccess: (submission) => emit('success', submission),
  onError: () => props.onError,
});

const rendererProps = computed(() => {
  const { id, apiBase, onError, initialValues, ...rest } = props;
  return rest;
});

function handled() {}

function act(action: Exclude<CloudAction, null>) {
  if (action === 'reload') window.location.reload();
  else root.value?.querySelector('form')?.requestSubmit();
}

let frame = 0;
watch(() => state.value.attempt, () => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => focusProblem(root.value, notice.value?.box ?? null));
}, { flush: 'post' });
onBeforeUnmount(() => cancelAnimationFrame(frame));
</script>

<template>
  <template v-if="state.loadError">
    <p role="alert" class="fh-form__error">{{ state.loadError.message }}</p>
    <button
      v-if="state.loadError instanceof CloudError && state.loadError.retryable"
      type="button"
      class="fh-form-actions__button fh-form-actions__button--secondary"
      @click="retry"
    >
      Try again
    </button>
  </template>
  <div v-else-if="!state.definition" class="fh-form" aria-busy="true"><slot name="fallback" /></div>
  <slot v-else-if="state.done" name="success">
    <p role="status" class="fh-form__success">Thank you. Your response was submitted.</p>
  </slot>
  <div v-else ref="root" class="fh-cloud">
    <CloudNotice ref="notice" :notice="state.notice" @action="act" />
    <FormRenderer
      v-bind="rendererProps"
      :key="state.revision"
      :definition="state.definition"
      :initial-values="state.initialValues ?? initialValues"
      :errors="state.errors"
      :submit-handler="submit"
      :on-error="handled"
    />
  </div>
</template>
