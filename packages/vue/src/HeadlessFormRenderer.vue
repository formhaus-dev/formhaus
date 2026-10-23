<script setup lang="ts">
import { errorSummary, isSection, type FormEvent, type FormField, type LabelKey } from '@formhaus/core';
import {
  actionTestIds,
  actionValues,
  actionsView,
  hasValue,
  engineLabel,
  matrixColumns,
  ROOT_PROPS,
  shouldApplyExternalErrors,
  testIds,
} from '@formhaus/core/internal';
import { computed, h, provide, ref, watch, type FunctionalComponent } from 'vue';
import FieldResolver from './FieldResolver.vue';
import FormGroup from './FormGroup.vue';
import DefaultSection from './DefaultSection.vue';
import { useFormFocus } from './composables/useFormFocus';
import { useFormId } from './composables/useFormId';
import { useEngineOptions } from './composables/useEngineOptions';
import { useRendererActions } from './composables/useRendererActions';
import { useFormEngine } from './composables/useFormEngine';
import { useStepTexts } from './composables/useStepTexts';
import { useValuesSync } from './composables/useValuesSync';
import { useNodeProps } from './composables/useNodeProps';
import type { FieldsContainerProps, FormRendererEmits, FormRendererProps } from './types';

const props = withDefaults(defineProps<FormRendererProps>(), {
  loading: false,
  headingLevel: 2,
  confirmRemove: true,
  errorSummary: true,
});

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
  visibleNodes,
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

const { rememberFocus, showField, requestFocus } = useFormFocus(form, formRef, formId, invalidAttempts, () => errorCount.value > 1);

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
const { step, stepStatuses } = useStepTexts(form, stepErrors);

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

const { nodeProps, sectionProps } = useNodeProps(form, props, formId, disabled, testId, {
  update: onFieldUpdate,
  commit: onFieldCommit,
  changeItems: onItemsChange,
  blur: onFieldBlur,
  focus: onFieldFocus,
});

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
    ? { rootProps: ROOT_PROPS.progress, marks: !!props.stepErrorMarks, steps: stepStatuses.value }
    : { steps: props.stepErrorMarks ? stepStatuses.value : undefined },
);
const summary = computed(() => ({
  rootProps: { ...ROOT_PROPS.errorSummary, 'data-testid': testId.value?.('summary') },
  title: label('errorSummary'),
  groups: errorView.value.groups,
  count: errorCount.value,
  showField,
}));

const actions = computed(() => {
  void [currentStep.value, isFirstStep.value, isLastStep.value, isMultiStep.value];
  const view = actionsView(form.engine, props.labels);
  return Object.fromEntries(Object.entries(view).map(([key, value]) => [key.replace(/[A-Z]/g, '-$&').toLowerCase(), value]));
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
      <template v-for="node in visibleNodes" :key="node.key">
        <component :is="props.layout?.section ?? props.components?.section ?? DefaultSection" v-if="isSection(node)" v-bind="sectionProps(node)">
          <component
            :is="child.type === 'group' ? FormGroup : FieldResolver"
            v-for="(child, row) in node.fields"
            :key="child.key"
            v-bind="nodeProps(child as FormField, matrixColumns(node), row)"
          />
        </component>
        <component :is="node.type === 'group' ? FormGroup : FieldResolver" v-else v-bind="nodeProps(node as FormField)" />
      </template>
    </component>

    <template v-if="formErrors.length > 0">
      <component :is="props.layout.formErrors" v-if="props.layout?.formErrors" :root-props="ROOT_PROPS.formErrors" :errors="formErrors" />
      <div v-else class="fh-form__top-errors" v-bind="ROOT_PROPS.formErrors">
        <p v-for="(error, i) in formErrors" :key="i" class="fh-form__top-error">{{ error }}</p>
      </div>
    </template>

    <template v-if="props.errorSummary && errorCount > 0">
      <component :is="props.layout.errorSummary" v-if="props.layout?.errorSummary" v-bind="summary" />
      <div v-else class="fh-error-summary" v-bind="summary.rootProps">
        <strong class="fh-error-summary__title">{{ summary.title }}</strong>
        <template v-for="group in summary.groups" :key="group.id">
          <p v-if="summary.groups.length > 1" class="fh-error-summary__step">{{ group.title }}</p>
          <ul class="fh-error-summary__list">
            <li v-for="entry in group.entries" :key="entry.key"><a class="fh-error-summary__link" :href="`#${entry.id}`" @click.prevent="showField(entry.key)">{{ entry.text }}</a></li>
          </ul>
        </template>
      </div>
    </template>

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
