<script setup lang="ts">
import { shouldApplyExternalErrors, type FormEngineOptions, type StepChangeContext } from '@formhaus/core';
import { computed, nextTick, ref, watch } from 'vue';
import FieldResolver from './FieldResolver.vue';
import { useFieldOptions } from './composables/useFieldOptions';
import { useRendererActions } from './composables/useRendererActions';
import { useFormEngine } from './composables/useFormEngine';
import type { FormRendererEmits, FormRendererProps } from './types';

const props = withDefaults(defineProps<FormRendererProps>(), { loading: false });

const emit = defineEmits<FormRendererEmits>();

const formRef = ref<HTMLFormElement>();
const engineOptions: FormEngineOptions = {
  validators: props.validators,
  get onStepValidate() { return props.onStepValidate; },
  get onBeforeStepChange() { return props.onBeforeStepChange; },
  get onBeforeSubmit() { return props.onBeforeSubmit; },
  get onAfterSubmit() { return props.onAfterSubmit; },
  get onAfterStepChange() {
    const after = props.onAfterStepChange;
    return async (context: StepChangeContext) => {
      emit('stepChange', context.toStepId, context.direction);
      if (context.direction === 'next') {
        emit('analyticsEvent', { type: 'step_completed', stepId: context.fromStepId });
        emit('analyticsEvent', { type: 'step_viewed', stepId: context.toStepId, stepIndex: form.engine.currentStepIndex });
      }
      await after?.(context);
    };
  },
};

const form = useFormEngine(() => props.definition, props.initialValues, engineOptions);
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

watch(
  [() => props.errors, () => form.engine],
  ([newErrors, engine], [oldErrors, oldEngine]) => {
    if (!newErrors) return;
    if (!shouldApplyExternalErrors(engine, engine === oldEngine ? oldErrors : undefined, newErrors)) return;
    engine.setErrors(newErrors);
  },
  { immediate: true },
);

const { update: onFieldUpdate, commit: onFieldCommit, next: onNext, prev: onPrev, submit: onSubmit, actionError } =
  useRendererActions(form, props, emit);
const formErrors = computed(() => (actionError.value ? [...topLevelErrors.value, actionError.value] : topLevelErrors.value));

let previousStep = currentStep.value?.id;
let focusPending = false;
let focusReturn: HTMLElement | null = null;
let wasBusy = false;
function rememberFocus(event: FocusEvent) { focusReturn = event.target as HTMLElement; }
watch([currentStep, stepValidating, submitting], async () => {
  if (currentStep.value?.id !== previousStep) focusPending = true;
  previousStep = currentStep.value?.id;
  if (stepValidating.value || submitting.value) {
    wasBusy = true;
    return;
  }
  const restore = wasBusy;
  wasBusy = false;
  if (!focusPending) {
    const document = formRef.value?.ownerDocument;
    if (restore && document?.activeElement === document?.body && focusReturn?.isConnected) focusReturn.focus();
    return;
  }
  focusPending = false;
  await nextTick();
  const target = formRef.value?.querySelector<HTMLElement>(
    '.fh-form__fields input:not(:disabled), .fh-form__fields select:not(:disabled), .fh-form__fields textarea:not(:disabled), .fh-form__fields button:not(:disabled)',
  );
  (target ?? formRef.value)?.focus();
}, { flush: 'post' });

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

const primaryLabel = computed(() => {
  if (isMultiStep.value && !effectiveIsLastStep.value) {
    return typeof currentStep.value?.next === 'object' ? currentStep.value.next.label ?? 'Continue' : 'Continue';
  }
  return props.definition.submit?.label ?? 'Submit';
});

const showBack = computed(() => {
  return isMultiStep.value && !isFirstStep.value && currentStep.value?.back !== false;
});

const backLabel = computed(() => {
  const back = currentStep.value?.back;
  return (typeof back === 'object' ? back?.label : undefined) ?? 'Back';
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
  <form ref="formRef" @focusin="rememberFocus" class="fh-form" tabindex="-1" :aria-busy="props.loading || stepValidating || submitting" @submit.prevent="onPrimary">
    <component
      :is="props.progressComponent"
      v-if="isMultiStep && props.progressComponent"
      :current="progress.current"
      :total="progress.total"
      :step-title="currentStep?.title"
      :step-description="currentStep?.description"
    />

    <div class="fh-form__fields">
      <FieldResolver
        v-for="field in fieldsWithOptions"
        :key="field.key"
        :field="field"
        :value="values[field.key]"
        :error="errors[field.key]"
        :loading="fieldLoading[field.key]"
        :disabled="props.loading || stepValidating || submitting"
        :components="props.components"
        @update:value="(v) => onFieldUpdate(field.key, v)"
        @commit="(v) => onFieldCommit(field.key, v)"
        @blur="() => onFieldBlur(field.key)"
        @focus="() => onFieldFocus(field.key)"
      />
    </div>

    <div v-if="formErrors.length > 0" class="fh-form__top-errors">
      <p v-for="(error, i) in formErrors" :key="i" class="fh-form__top-error">
        {{ error }}
      </p>
    </div>

    <component
      :is="props.actionsComponent"
      v-if="props.actionsComponent"
      :submit-action="props.definition.submit"
      :back-action="currentStep?.back"
      :cancel-action="props.definition.cancel"
      :is-first-step="isFirstStep"
      :is-last-step="effectiveIsLastStep"
      :is-multi-step="isMultiStep"
      :loading="props.loading || stepValidating || submitting"
      :values="values"
      :primary-label="primaryLabel"
      :show-primary="effectiveIsLastStep || currentStep?.next !== false"
      :show-back="showBack"
      :back-label="backLabel"
      @submit="onSubmit"
      @next="onNext"
      @prev="onPrev"
      @cancel="onCancel"
      @primary="onPrimary"
    />
  </form>
</template>
