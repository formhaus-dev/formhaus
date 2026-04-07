<script setup lang="ts">
import type { FormEngineOptions, ValidatorFn } from '@formhaus/core';
import { computed, watch } from 'vue';
import FormActions from './FormActions.vue';
import FormFieldComponent from './FormField.vue';
import FormStepProgress from './FormStepProgress.vue';
import { useFieldOptions } from './composables/useFieldOptions';
import { useFormEngine } from './composables/useFormEngine';
import type { FieldComponentMap, FormRendererEmits, FormRendererProps, OptionsProvider } from './types';

const props = withDefaults(
  defineProps<
    FormRendererProps & {
      validators?: Record<string, ValidatorFn>;
      optionsProviders?: Record<string, OptionsProvider>;
    }
  >(),
  {
    loading: false,
  },
);

const emit = defineEmits<FormRendererEmits>();

const engineOptions: FormEngineOptions = {
  validators: props.validators,
};

const {
  engine,
  values,
  errors,
  topLevelErrors,
  fieldLoading,
  visibleFields,
  visibleSteps,
  currentStep,
  isFirstStep,
  isLastStep,
  canGoNext,
  progress,
  isMultiStep,
} = useFormEngine(props.schema, props.initialValues, engineOptions);

const resolvedOptions = useFieldOptions(visibleFields, values, props.optionsProviders);

watch(
  () => props.errors,
  (newErrors) => {
    if (newErrors) {
      engine.setErrors(newErrors);
    }
  },
);

function onFieldUpdate(key: string, value: unknown) {
  engine.setValue(key, value);
  emit('fieldChange', key, value, engine.values);
}

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

async function onSubmit() {
  const allErrors = engine.validate();
  for (const [key, msg] of Object.entries(allErrors)) {
    emit('analyticsEvent', { type: 'field_error', fieldKey: key, error: msg });
  }
  if (Object.keys(allErrors).length > 0) return;

  const submitValues = engine.getSubmitValues();
  emit('analyticsEvent', { type: 'form_submitted', fieldCount: Object.keys(submitValues).length });
  emit('submit', submitValues);
}

function onNext() {
  const prevStep = currentStep.value;
  const success = engine.nextStep();
  if (success) {
    if (prevStep) {
      emit('analyticsEvent', { type: 'step_completed', stepId: prevStep.id });
    }
    if (currentStep.value) {
      emit('stepChange', currentStep.value.id, 'next');
      emit('analyticsEvent', {
        type: 'step_viewed',
        stepId: currentStep.value.id,
        stepIndex: engine.currentStepIndex,
      });
    }
  }
}

function onPrev() {
  engine.prevStep();
  if (currentStep.value) {
    emit('stepChange', currentStep.value.id, 'back');
  }
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
    return currentStep.value?.next?.label ?? 'Continue';
  }
  return props.schema.submit?.label ?? 'Submit';
});

const showBack = computed(() => {
  return isMultiStep.value && !isFirstStep.value && currentStep.value?.back !== false;
});

const backLabel = computed(() => {
  const back = currentStep.value?.back;
  return (typeof back === 'object' ? back?.label : undefined) ?? 'Back';
});

function onPrimary() {
  if (isMultiStep.value && !effectiveIsLastStep.value) {
    onNext();
  } else {
    onSubmit();
  }
}
</script>

<template>
  <form class="fh-form" @submit.prevent>
    <component
      :is="props.progressComponent ?? FormStepProgress"
      v-if="isMultiStep"
      :current="progress.current"
      :total="progress.total"
      :step-title="currentStep?.title"
      :step-description="currentStep?.description"
    />

    <div class="fh-form__fields">
      <FormFieldComponent
        v-for="field in fieldsWithOptions"
        :key="field.key"
        :field="field"
        :value="values[field.key]"
        :error="errors[field.key]"
        :loading="fieldLoading[field.key]"
        :disabled="props.loading"
        :components="props.components"
        @update:value="(v) => onFieldUpdate(field.key, v)"
        @blur="() => onFieldBlur(field.key)"
        @focus="() => onFieldFocus(field.key)"
      />
    </div>

    <div v-if="topLevelErrors.length > 0" class="fh-form__top-errors">
      <p v-for="(error, i) in topLevelErrors" :key="i" class="fh-form__top-error">
        {{ error }}
      </p>
    </div>

    <component
      :is="props.actionsComponent ?? FormActions"
      :submit-action="props.schema.submit"
      :back-action="currentStep?.back"
      :cancel-action="props.schema.cancel"
      :is-first-step="isFirstStep"
      :is-last-step="effectiveIsLastStep"
      :is-multi-step="isMultiStep"
      :loading="props.loading"
      :values="values"
      :primary-label="primaryLabel"
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
