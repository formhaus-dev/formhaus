<script setup lang="ts">
import { type FunctionalComponent, computed, h, onBeforeUnmount, ref, useSlots, watch } from 'vue';
import type { FormEvent } from '@formhaus/core';
import { FormActions, FormRenderer } from '@formhaus/vue';
import { CloudError, type CloudAction, type CloudSubmission } from '@formhaus/core/cloud';
import { focusProblem } from '@formhaus/core/internal';
import CloudNotice from './CloudNotice.vue';
import type { FormhausFormProps } from './types';
import { useCloudForm } from './useCloudForm';

const props = withDefaults(defineProps<FormhausFormProps>(), { confirmRemove: true, errorSummary: true, draftStore: undefined });
defineSlots<{ fallback(): unknown; success(): unknown }>();
const emit = defineEmits<{
  success: [submission: CloudSubmission];
  fieldChange: [key: string, value: unknown, values: Record<string, unknown>];
  formEvent: [event: FormEvent];
}>();
const root = ref<HTMLDivElement | null>(null);
const trap = ref<HTMLInputElement | null>(null);
const box = ref<HTMLDivElement | null>(null);
const hidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
} as const;
const slots = useSlots();

const { state, submit, retry, again, saveDraft, warm } = useCloudForm({
  id: () => props.id,
  apiBase: () => props.apiBase,
  initialForm: () => props.initialForm,
  draftStore: () => props.draftStore,
  draftExclude: () => props.draftExclude,
  extraBody: () => ({ _fh_hp: trap.value?.value ?? '' }),
  challengeHost: () => box.value,
  onSuccess: (submission) => emit('success', submission),
  onError: () => props.onError,
});

const rendererProps = computed(() => {
  const { id, apiBase, onError, initialValues, initialForm, draftStore, draftExclude, ...rest } = props;
  return rest;
});

const ChallengeActions: FunctionalComponent = (_, { attrs }) => [
  h('div', { ref: box, style: 'display:contents' }),
  h(props.actionsComponent ?? FormActions, attrs),
];
ChallengeActions.inheritAttrs = false;

function handled() {}

function act(action: Exclude<CloudAction, null>) {
  if (action === 'reload') window.location.reload();
  else root.value?.querySelector('form')?.requestSubmit();
}

watch(
  root,
  (element, _, onCleanup) => {
    if (!element) return;
    element.addEventListener('focusin', warm);
    onCleanup(() => element.removeEventListener('focusin', warm));
    if (element.contains(document.activeElement)) warm();
  },
  { flush: 'post' },
);

watch(
  [() => !!state.value.challenge && !!state.value.definition && !state.value.done, () => state.value.revision],
  ([ready]) => {
    if (ready) warm();
  },
  { flush: 'post', immediate: true },
);

let frame = 0;
watch(
  () => state.value.attempt,
  () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() =>
      focusProblem(root.value, root.value?.querySelector<HTMLDivElement>(':scope > .fh-form__notice') ?? null),
    );
  },
  { flush: 'post' },
);
onBeforeUnmount(() => cancelAnimationFrame(frame));
watch(
  () => state.value.done,
  (done) => {
    if (done && state.value.settings.redirectUrl && !slots.success) window.location.assign(state.value.settings.redirectUrl);
  },
);

function onFieldChange(key: string, value: unknown, values: Record<string, unknown>) {
  saveDraft(values);
  emit('fieldChange', key, value, values);
}
</script>

<template>
  <div v-if="state.loadError" class="fh-cloud">
    <p role="alert" class="fh-form__error">{{ state.loadError.message }}</p>
    <button
      v-if="state.loadError instanceof CloudError && state.loadError.retryable"
      type="button"
      class="fh-form-actions__button fh-form-actions__button--secondary"
      @click="retry"
    >
      Try again
    </button>
  </div>
  <div v-else-if="!state.definition" class="fh-cloud"><div class="fh-form" aria-busy="true"><slot name="fallback" /></div></div>
  <div v-else-if="state.done" class="fh-cloud">
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
  </div>
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
      :actions-component="state.challenge ? ChallengeActions : props.actionsComponent"
      @field-change="onFieldChange"
      @form-event="(event: FormEvent) => emit('formEvent', event)"
    />
  </div>
</template>
