<script setup lang="ts">
import { type Component, type FunctionalComponent, computed, h, onBeforeUnmount, ref, useSlots, watch } from 'vue';
import type { FormEvent } from '@formhaus/core';
import { FormActions, FormRenderer } from '@formhaus/vue';
import { CloudError, type CloudNoticeActionFn } from '@formhaus/core/cloud';
import { CLOUD_NOTICE, cloudLabel, focusProblem, loadMessage, localNotice } from '@formhaus/core/internal';
import CloudNotice from './CloudNotice.vue';
import type { FormhausFormEvents, FormhausFormProps, FormhausFormSlots } from './types';
import { useCloudForm } from './useCloudForm';

const props = withDefaults(defineProps<FormhausFormProps>(), { confirmRemove: true, errorSummary: true, draftStore: undefined });
defineSlots<FormhausFormSlots>();
const emit = defineEmits<FormhausFormEvents>();
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

const { state, submit, retry, again, relay, saveDraft, warm } = useCloudForm({
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
  const {
    id,
    apiBase,
    onError,
    initialValues,
    initialForm,
    draftStore,
    draftExclude,
    cloudLabels,
    noticePlacement,
    actionsComponent,
    ...rest
  } = props;
  return rest;
});

const notice = computed(() => localNotice(state.value.notice, props.cloudLabels));

const act: CloudNoticeActionFn = (action) => {
  if (action === 'reload') window.location.reload();
  else root.value?.querySelector('form')?.requestSubmit();
};

const NoticeView: FunctionalComponent = () =>
  notice.value &&
  (slots.notice?.({ notice: notice.value, onAction: act }) ??
    h(CloudNotice, { notice: notice.value, labels: props.cloudLabels, onAction: act }));

function takesNotice(component: Component): boolean {
  const declared = (component as { props?: unknown }).props;
  return Array.isArray(declared) ? declared.includes('notice') : !!declared && typeof declared === 'object' && 'notice' in declared;
}

const CloudActions: FunctionalComponent = (_, context) => {
  const actions = props.layout?.actions ?? props.actionsComponent ?? FormActions;
  const { rootProps, ...rest } = context.attrs;
  const attrs = actions === props.layout?.actions || actions === FormActions ? context.attrs : rest;
  return [
    state.value.challenge && h('div', { ref: box, style: 'display:contents' }),
    props.noticePlacement === 'actions' && h(NoticeView),
    h(actions, takesNotice(actions) ? { ...attrs, notice: notice.value, onNoticeAction: act } : attrs),
  ];
};
CloudActions.inheritAttrs = false;

let summaryCount = 0;
const CloudSummary: FunctionalComponent = (_, { attrs }) => {
  summaryCount = attrs.count as number;
  return h(props.layout!.errorSummary!, attrs);
};
CloudSummary.inheritAttrs = false;
const layoutSlots = computed(() => ({
  ...props.layout,
  actions: CloudActions,
  errorSummary: props.layout?.errorSummary && CloudSummary,
}));

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
    const several = props.layout?.errorSummary && (() => summaryCount > 1);
    frame = requestAnimationFrame(() => focusProblem(root.value, root.value?.querySelector<HTMLElement>(CLOUD_NOTICE) ?? null, several));
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
    <p role="alert" class="fh-form__error">{{ loadMessage(state.loadError, cloudLabels) }}</p>
    <button
      v-if="state.loadError instanceof CloudError && state.loadError.retryable"
      type="button"
      class="fh-form-actions__button fh-form-actions__button--secondary"
      @click="retry"
    >
      {{ cloudLabel(cloudLabels, 'retry') }}
    </button>
  </div>
  <div v-else-if="!state.definition" class="fh-cloud"><div class="fh-form" aria-busy="true"><slot name="fallback" /></div></div>
  <div v-else-if="state.done" class="fh-cloud">
    <slot name="success">
      <p role="status" class="fh-form__success">{{ state.settings.successMessage ?? cloudLabel(cloudLabels, 'submitted') }}</p>
    </slot>
    <button
      v-if="state.settings.allowAnother"
      type="button"
      class="fh-form-actions__button fh-form-actions__button--secondary"
      @click="again"
    >
      {{ cloudLabel(cloudLabels, 'submitAnother') }}
    </button>
  </div>
  <div v-else ref="root" class="fh-cloud">
    <input ref="trap" name="_fh_hp" tabindex="-1" autocomplete="off" aria-hidden="true" :style="hidden" />
    <NoticeView v-if="noticePlacement !== 'actions'" />
    <FormRenderer
      v-bind="rendererProps"
      :hidden-values="undefined"
      :key="state.revision"
      :definition="state.definition"
      :initial-values="state.initialValues ?? initialValues"
      :errors="state.errors"
      :on-submit="submit"
      :on-error="relay"
      :layout="layoutSlots"
      @field-change="onFieldChange"
      @form-event="(event: FormEvent) => emit('formEvent', event)"
    />
  </div>
</template>
