<script setup lang="ts">
import type { FormEngineOptions, ValidatorFn } from '@formhaus/core';
import { computed, watch } from 'vue';
import FormActions from './FormActions.vue';
import FormFieldComponent from './FormField.vue';
import FormStepProgress from './FormStepProgress.vue';
import { useFormEngine } from './composables/useFormEngine';
import type { FieldComponentMap, FormRendererEmits, FormRendererProps } from './types';

const props = withDefaults(
  defineProps<
    FormRendererProps & {
      validators?: Record<string, ValidatorFn>;
      actions?: Record<string, (values: Record<string, unknown>) => Promise<void> | void>;
      optionsProviders?: Record<
        string,
        (values: Record<string, unknown>) => unknown[] | Promise<unknown[]>
      >;
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

// Watch for external errors
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

function onFieldBlur(_key: string) {
  // Intentionally no validation on blur.
  // Validation runs only on Submit / Continue click.
}

async function onSubmit() {
  const allErrors = engine.validate();
  if (Object.keys(allErrors).length > 0) return;

  const submitValues = engine.getSubmitValues();
  emit('submit', submitValues);
}

function onNext() {
  const success = engine.nextStep();
  if (success && currentStep.value) {
    emit('stepChange', currentStep.value.id, 'next');
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
        v-for="field in visibleFields"
        :key="field.key"
        :field="field"
        :value="values[field.key]"
        :error="errors[field.key]"
        :loading="fieldLoading[field.key]"
        :disabled="props.loading"
        :components="props.components"
        @update:value="(v) => onFieldUpdate(field.key, v)"
        @blur="() => onFieldBlur(field.key)"
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

<style scoped>
.fh-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.fh-form__fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fh-form__top-errors {
  padding: 16px;
}

.fh-form__top-error {
  margin: 0;
}

.fh-form__top-error + .fh-form__top-error {
  margin-top: 8px;
}
</style>
