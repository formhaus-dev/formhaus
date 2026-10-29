<script setup lang="ts">
import { errorSummary, type FormEvent, type LabelKey } from '@formhaus/core';
import {
  actionTestIds,
  actionValues,
  actionsView,
  hasValue,
  engineLabel,
  ROOT_PROPS,
  shouldApplyExternalErrors,
  testIds,
} from '@formhaus/core/internal';
import { computed, h, provide, ref, watch, type FunctionalComponent } from 'vue';
import { FormNodeView, NODE_CONTEXT } from './FormNodeView';
import { useFormFocus } from './composables/useFormFocus';
import { useFormId } from './composables/useFormId';
import { useEngineOptions } from './composables/useEngineOptions';
import { useRendererActions } from './composables/useRendererActions';
import { useFormEngine } from './composables/useFormEngine';
import { useStepTexts } from './composables/useStepTexts';
import { useValuesSync } from './composables/useValuesSync';
import { useNodeProps } from './composables/useNodeProps';
import { formRendererProps } from './props';
import type { FieldsContainerProps, FormRendererEmits } from './types';
import { DefaultSummary } from './DefaultSummary';

const props = defineProps(formRendererProps);

const emit = defineEmits<FormRendererEmits>();

const formId = useFormId();
const formRef = ref<HTMLFormElement>();
const onFormEvent = (event: FormEvent) => emit('formEvent', event);
const engineOptions = useEngineOptions(props, onFormEvent);

const form = useFormEngine(
  () => props.definition,
  () => props.initialValues,
  engineOptions,
);
const {
  values,
  errors,
  topLevelErrors,
  fieldLoading,
  visibleFields,
  currentStep,
  isFirstStep,
  isLastStep,
  progress,
  isMultiStep,
  stepValidating,
  submitting,
} = form;

useValuesSync(form, props, emit);

const {
  update: onFieldUpdate,
  changeItems: onItemsChange,
  commit: onFieldCommit,
  next: onNext,
  back: onBack,
  skip: onSkip,
  submit: onSubmit,
  actionError,
  invalidAttempts,
} = useRendererActions(form, props, emit);
const formErrors = computed(() => (actionError.value ? [...topLevelErrors.value, actionError.value] : topLevelErrors.value));

const getErrors = () => errorSummary(form.engine, { idPrefix: formId, labels: props.labels });
const errorView = computed(() => {
  void [errors.value, progress.value, values.value];
  return getErrors();
});
const errorCount = computed(() => errorView.value.count);

const { rememberFocus, showField, requestFocus } = useFormFocus(
  form,
  formRef,
  formId,
  invalidAttempts,
  () => errorCount.value > 1,
  () => props.stepFocus === 'heading',
);

watch(
  [() => props.errors, () => form.engine],
  ([newErrors, engine], [oldErrors, oldEngine]) => {
    if (!newErrors) return;
    if (!shouldApplyExternalErrors(engine, engine === oldEngine ? oldErrors : undefined, newErrors)) return;
    engine.setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) requestFocus();
  },
  { immediate: true },
);

const stepErrors = computed(() => {
  void [errors.value, progress.value];
  return form.engine.stepErrors;
});
const { step, stepStatuses, errorsLabel } = useStepTexts(form, stepErrors, (key, params) => label(key, params));

function onFieldFocus(key: string) {
  onFormEvent({ type: 'field_focused', fieldKey: key });
}

function onFieldBlur(key: string) {
  onFormEvent({ type: 'field_blurred', fieldKey: key, hasValue: hasValue(form.engine, key) });
}

function onCancel() {
  emit('cancel');
}

const disabled = computed(() => props.loading || stepValidating.value || submitting.value);
const testId = computed(() => testIds(props.testIds, props.definition.id));

const { shown, ...nodeContext } = useNodeProps(form, props, formId, disabled, testId, {
  update: onFieldUpdate,
  commit: onFieldCommit,
  changeItems: onItemsChange,
  blur: onFieldBlur,
  focus: onFieldFocus,
});
provide(NODE_CONTEXT, nodeContext);

defineExpose({
  setValue: (key: string, value: unknown) => form.engine.setValue(key, value),
  getValues: () => ({ ...form.engine.values }),
  goToStep: (stepId: string) => form.engine.goToStep(stepId),
  showField,
  getErrors: () => ({ ...getErrors(), topLevelErrors: formErrors.value }),
  values,
});

const label = (key: LabelKey, params: Record<string, unknown> = {}) => engineLabel(form.engine, key, params, props.labels);
provide('fhLabel', label);

const DefaultFields: FunctionalComponent<FieldsContainerProps> = (fields, { slots }) =>
  h('div', { class: 'fh-form__fields', ...fields.rootProps }, slots.default?.());
DefaultFields.props = ['rootProps'];
const progressComponent = computed(() => props.layout?.progress ?? props.progressComponent);
const actionsComponent = computed(() => props.layout?.actions ?? props.actionsComponent);
const progressSlot = computed(() =>
  props.layout?.progress
    ? {
        rootProps: ROOT_PROPS.progress,
        marks: !!props.stepErrorMarks,
        steps: stepStatuses.value,
        stepErrorsLabel: errorsLabel(stepErrors.value[currentStep.value?.id as string]?.length),
      }
    : { steps: props.stepErrorMarks ? stepStatuses.value : undefined },
);
const summaryAt = computed(() =>
  props.errorSummary && errorCount.value > 0 ? (props.errorSummary === 'top' ? 'top' : 'bottom') : undefined,
);
const summary = computed(() => ({
  rootProps: { ...ROOT_PROPS.errorSummary, 'data-testid': testId.value?.('summary') },
  title: label('errorSummary'),
  groups: errorView.value.groups,
  count: errorCount.value,
  showField,
}));

const actions = computed(() => {
  void [currentStep.value, isFirstStep.value, isLastStep.value, isMultiStep.value, values.value];
  const view = actionsView(form.engine, props.labels, actionValues(form.engine));
  return Object.fromEntries(
    Object.entries(view)
      .filter(([key]) => props.layout?.actions || key !== 'primaryDisabled')
      .map(([key, value]) => [key.replace(/[A-Z]/g, '-$&').toLowerCase(), value]),
  );
});

async function onPrimary() {
  if (isLastStep.value || !isMultiStep.value) {
    onSubmit();
  } else {
    await onNext();
  }
}
</script>

<template>
  <form ref="formRef" :lang="props.definition.lang" @focusin="rememberFocus" class="fh-form" tabindex="-1" :aria-busy="disabled" :data-testid="testId?.('form')" @submit.prevent="onPrimary">
    <component :is="props.layout?.errorSummary ?? DefaultSummary" v-if="summaryAt === 'top'" v-bind="summary" />

    <component
      :is="progressComponent"
      v-if="isMultiStep && progressComponent"
      v-bind="progressSlot"
      :current="progress.current"
      :total="progress.total"
      :step-title="step?.title"
      :step-description="step?.description"
      :heading-level="props.headingLevel"
      :step-error-count="stepErrors[currentStep?.id as string]?.length"
      :counter-label="label('stepOf', progress)"
    />

    <component :is="props.layout?.fields ?? DefaultFields" :root-props="ROOT_PROPS.fields">
      <FormNodeView v-for="node in shown.nodes" :key="node.key" :node="node" :slots="shown.slots" />
    </component>

    <template v-if="formErrors.length > 0">
      <component :is="props.layout.formErrors" v-if="props.layout?.formErrors" :root-props="ROOT_PROPS.formErrors" :errors="formErrors" />
      <div v-else class="fh-form__top-errors" v-bind="ROOT_PROPS.formErrors">
        <p v-for="(error, i) in formErrors" :key="i" class="fh-form__top-error">{{ error }}</p>
      </div>
    </template>

    <component :is="props.layout?.errorSummary ?? DefaultSummary" v-if="summaryAt === 'bottom'" v-bind="summary" />

    <component
      :is="actionsComponent"
      v-if="actionsComponent"
      v-bind="props.layout?.actions ? { ...actions, rootProps: ROOT_PROPS.actions } : actions"
      :loading="disabled"
      :values="actionValues(form.engine)"
      :test-ids="actionTestIds(testId)"
      @submit="onSubmit"
      @next="onNext"
      @back="onBack"
      @cancel="onCancel"
      @skip="onSkip"
      @primary="onPrimary"
    />
  </form>
</template>
