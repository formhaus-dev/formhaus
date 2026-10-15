<script setup lang="ts">
import type { FormEngineOptions, LabelKey, StepChangeContext } from '@formhaus/core';
import { fieldDomId, labelFor, shouldApplyExternalErrors } from '@formhaus/core/internal';
import { computed, ref, watch } from 'vue';
import FieldResolver from './FieldResolver.vue';
import { useFormFocus } from './composables/useFormFocus';
import { useFormId } from './composables/useFormId';
import { useFieldOptions } from './composables/useFieldOptions';
import { useRendererActions } from './composables/useRendererActions';
import { useFormEngine } from './composables/useFormEngine';
import type { FormRendererEmits, FormRendererProps } from './types';

const props = withDefaults(defineProps<FormRendererProps>(), { loading: false, headingLevel: 2 });

const emit = defineEmits<FormRendererEmits>();

const formId = useFormId();
const formRef = ref<HTMLFormElement>();
const engineOptions: FormEngineOptions = {
  validators: props.validators,
  onWarning: props.onWarning,
  get messages() { return props.messages; },
  get onStepValidate() { return props.onStepValidate; },
  get onBeforeStepChange() { return props.onBeforeStepChange; },
  get onBeforeSubmit() { return props.onBeforeSubmit; },
  get onAfterSubmit() { return props.onAfterSubmit; },
  get onAfterStepChange() {
    const after = props.onAfterStepChange;
    return async (context: StepChangeContext) => {
      if (context.reason !== 'back') {
        emit('analyticsEvent', { type: context.reason === 'skip' ? 'step_skipped' : 'step_completed', stepId: context.fromStepId });
        emit('analyticsEvent', { type: 'step_viewed', stepId: context.toStepId, stepIndex: form.engine.currentStepIndex });
      }
      await after?.(context);
    };
  },
};

const form = useFormEngine(() => props.definition, () => props.initialValues, engineOptions);
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

const resolvedOptions = useFieldOptions(visibleFields, () => form.engine, props.optionsProviders);

const { update: onFieldUpdate, commit: onFieldCommit, next: onNext, prev: onPrev, skip: onSkip, submit: onSubmit, actionError, invalidAttempts } =
  useRendererActions(form, props, emit);
const formErrors = computed(() => (actionError.value ? [...topLevelErrors.value, actionError.value] : topLevelErrors.value));

const { rememberFocus, showField, requestFocus } = useFormFocus(form, formRef, formId, invalidAttempts);

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

const summaryFields = computed(() => (isMultiStep.value ? form.visibleSteps.value.flatMap((step) => step.fields) : visibleFields.value)
  .filter((field) => field.type !== 'hidden' && errors.value[field.key] !== undefined));
const stepStatuses = computed(() => props.stepErrorMarks ? form.visibleSteps.value.map(({ id, title, fields }) => ({
  id, title, errorCount: fields.filter((field) => field.type !== 'hidden' && errors.value[field.key] !== undefined).length,
})) : undefined);

function onFieldFocus(key: string) {
  emit('analyticsEvent', { type: 'field_focused', fieldKey: key });
}

function onFieldBlur(key: string) {
  emit('analyticsEvent', {
    type: 'field_blurred',
    fieldKey: key,
    hasValue: values.value[key] !== undefined && values.value[key] !== '',
  });
}

function onCancel() {
  emit('cancel');
}

const fieldsWithOptions = computed(() =>
  visibleFields.value.map((field) => {
    const resolved = resolvedOptions.value[field.key];
    return resolved ? { ...field, options: resolved } : field;
  }),
);

const effectiveIsLastStep = computed(() => isLastStep.value || !isMultiStep.value);

const label = (key: LabelKey, params: Record<string, unknown> = {}) => labelFor(key, params, props.labels, props.definition.labels);

const primaryLabel = computed(() => {
  if (isMultiStep.value && !effectiveIsLastStep.value) {
    return (typeof currentStep.value?.next === 'object' ? currentStep.value.next.label : undefined) ?? label('continue');
  }
  return props.definition.submit?.label ?? 'Submit';
});

const showBack = computed(() => {
  return isMultiStep.value && !isFirstStep.value && currentStep.value?.back !== false;
});

const backLabel = computed(() => {
  const back = currentStep.value?.back;
  return (typeof back === 'object' ? back?.label : undefined) ?? label('back');
});

async function onPrimary() {
  if (isMultiStep.value && !effectiveIsLastStep.value) {
    await onNext();
  } else {
    onSubmit();
  }
}
</script>

<template>
  <form ref="formRef" :lang="props.definition.lang" @focusin="rememberFocus" class="fh-form" tabindex="-1" :aria-busy="props.loading || stepValidating || submitting" @submit.prevent="onPrimary">
    <component
      :is="props.progressComponent"
      v-if="isMultiStep && props.progressComponent"
      :current="progress.current"
      :total="progress.total"
      :step-title="currentStep?.title"
      :step-description="currentStep?.description"
      :heading-level="props.headingLevel"
      :steps="stepStatuses"
      :counter-label="label('stepOf', progress)"
    />

    <div v-if="props.errorSummary && summaryFields.length > 0" class="fh-error-summary" role="alert">
      <strong class="fh-error-summary__title">{{ label('errorSummary') }}</strong>
      <ul class="fh-error-summary__list">
        <li v-for="field in summaryFields" :key="field.key">
          <a class="fh-error-summary__link" :href="`#${fieldDomId(formId, field.key, form.engine.definition)}`" @click.prevent="showField(field.key)">{{ field.label }}: {{ errors[field.key] }}</a>
        </li>
      </ul>
    </div>

    <div class="fh-form__fields">
      <FieldResolver
        v-for="field in fieldsWithOptions"
        :key="field.key"
        :id="fieldDomId(formId, field.key, form.engine.definition)"
        :field="field"
        :model-value="values[field.key]"
        :error="errors[field.key]"
        :loading="fieldLoading[field.key]"
        :disabled="props.loading || stepValidating || submitting"
        :components="props.components"
        @update:model-value="(v) => onFieldUpdate(field.key, v)"
        @commit="(v) => onFieldCommit(field.key, v)"
        @blur="() => onFieldBlur(field.key)"
        @focus="() => onFieldFocus(field.key)"
      />
    </div>

    <div v-if="formErrors.length > 0" class="fh-form__top-errors" role="alert">
      <p v-for="(error, i) in formErrors" :key="i" class="fh-form__top-error">
        {{ error }}
      </p>
    </div>

    <component
      :is="props.actionsComponent"
      v-if="props.actionsComponent"
      :submit-action="props.definition.submit"
      :next-action="currentStep?.next"
      :back-action="currentStep?.back"
      :cancel-action="props.definition.cancel"
      :skip-action="currentStep?.skip"
      :is-first-step="isFirstStep"
      :is-last-step="effectiveIsLastStep"
      :is-multi-step="isMultiStep"
      :loading="props.loading || stepValidating || submitting"
      :values="form.engine.getSubmitValues()"
      :primary-label="primaryLabel"
      :show-primary="effectiveIsLastStep || currentStep?.next !== false"
      :show-back="showBack"
      :back-label="backLabel"
      :show-skip="!!currentStep?.skip && currentStep.next !== false"
      @submit="onSubmit"
      @next="onNext"
      @prev="onPrev"
      @cancel="onCancel"
      @skip="onSkip"
      @primary="onPrimary"
    />
  </form>
</template>
