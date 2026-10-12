<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useSlots, watch } from 'vue';
import { FormRenderer } from '@formhaus/vue';
import { CloudError, type CloudAction } from '@formhaus/core/cloud';
import { focusProblem } from '@formhaus/core/internal';
import CloudNotice from './CloudNotice.vue';
import type { FormhausFormProps } from './types';
import { useCloudForm } from './useCloudForm';

const props = defineProps<FormhausFormProps>();
const emit = defineEmits<{
  success: [submission: { id: string; values: Record<string, unknown> }];
  fieldChange: [key: string, value: unknown, values: Record<string, unknown>];
}>();
const root = ref<HTMLDivElement | null>(null);
const trap = ref<HTMLInputElement | null>(null);
const hidden = { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)' } as const;
const slots = useSlots();

const { state, submit, retry, again, saveDraft } = useCloudForm({
  id: () => props.id,
  apiBase: () => props.apiBase,
  initialForm: () => props.initialForm,
  draftStore: () => props.draftStore,
  extraBody: () => ({ _fh_hp: trap.value?.value ?? '' }),
  onSuccess: (submission) => emit('success', submission),
  onError: () => props.onError,
});

const rendererProps = computed(() => {
  const { id, apiBase, onError, initialValues, initialForm, draftStore, ...rest } = props;
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
  frame = requestAnimationFrame(() => focusProblem(root.value, root.value?.querySelector<HTMLDivElement>(':scope > .fh-form__notice') ?? null));
}, { flush: 'post' });
onBeforeUnmount(() => cancelAnimationFrame(frame));
watch(() => state.value.done, (done) => {
  if (done && state.value.settings.redirectUrl && !slots.success) window.location.assign(state.value.settings.redirectUrl);
});

function onFieldChange(key: string, value: unknown, values: Record<string, unknown>) {
  saveDraft(values);
  emit('fieldChange', key, value, values);
}
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
  <template v-else-if="state.done">
    <slot name="success">
      <p role="status" class="fh-form__success">{{ state.settings.successMessage ?? 'Thank you. Your response was submitted.' }}</p>
    </slot>
    <button
      v-if="state.settings.allowAnother"
      type="button"
      class="fh-form-actions__button fh-form-actions__button--secondary"
      @click="again"
    >
      Submit another response
    </button>
  </template>
  <div v-else ref="root" class="fh-cloud">
    <input ref="trap" name="_fh_hp" tabindex="-1" autocomplete="off" aria-hidden="true" :style="hidden" />
    <CloudNotice :notice="state.notice" @action="act" />
    <FormRenderer
      v-bind="rendererProps"
      :key="state.revision"
      :definition="state.definition"
      :initial-values="state.initialValues ?? initialValues"
      :errors="state.errors"
      :on-submit="submit"
      :on-error="handled"
      @field-change="onFieldChange"
    />
  </div>
</template>
