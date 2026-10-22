<script setup lang="ts">
import { isSection, type FormEvent, type FormField, type LabelKey } from '@formhaus/core';
import { actionValues, actionsView, errorGroups, hasValue, labelFor, shouldApplyExternalErrors } from '@formhaus/core/internal';
import { computed, provide, ref, watch } from 'vue';
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
import type { FormRendererEmits, FormRendererProps } from './types';

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

const summaryGroups = computed(() => {
  void [errors.value, progress.value, values.value];
  return errorGroups(form.engine, formId, props.labels, props.definition.labels);
});
const stepErrors = computed(() => {
  void [errors.value, progress.value];
  return form.engine.stepErrors;
});
const { step, stepStatuses } = useStepTexts(form, stepErrors, () => props.stepErrorMarks);

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

const { nodeProps, sectionProps } = useNodeProps(form, props, formId, disabled, {
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
  values,
});

const label = (key: LabelKey, params: Record<string, unknown> = {}) => labelFor(key, params, props.labels, props.definition.labels);
provide('fhLabel', label);

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
  <form ref="formRef" :lang="props.definition.lang" @focusin="rememberFocus" class="fh-form" tabindex="-1" :aria-busy="disabled" @submit.prevent="onPrimary">
    <component
      :is="props.progressComponent"
      v-if="isMultiStep && props.progressComponent"
      :current="progress.current"
      :total="progress.total"
      :step-title="step?.title"
      :step-description="step?.description"
      :heading-level="props.headingLevel"
      :steps="stepStatuses"
      :step-error-count="stepErrors[currentStep?.id as string]?.length"
      :counter-label="label('stepOf', progress)"
    />

    <div class="fh-form__fields">
      <template v-for="node in visibleNodes" :key="node.key">
        <component :is="props.components?.section ?? DefaultSection" v-if="isSection(node)" v-bind="sectionProps(node)">
          <component :is="child.type === 'group' ? FormGroup : FieldResolver" v-for="child in node.fields" :key="child.key" v-bind="nodeProps(child as FormField)" />
        </component>
        <component :is="node.type === 'group' ? FormGroup : FieldResolver" v-else v-bind="nodeProps(node as FormField)" />
      </template>
    </div>

    <div v-if="formErrors.length > 0" class="fh-form__top-errors" role="alert">
      <p v-for="(error, i) in formErrors" :key="i" class="fh-form__top-error">{{ error }}</p>
    </div>

    <div v-if="props.errorSummary && summaryGroups.length > 0" class="fh-error-summary" role="alert" tabindex="-1">
      <strong class="fh-error-summary__title">{{ label('errorSummary') }}</strong>
      <template v-for="group in summaryGroups" :key="group.id">
        <p v-if="summaryGroups.length > 1" class="fh-error-summary__step">{{ group.title }}</p>
        <ul class="fh-error-summary__list">
          <li v-for="entry in group.entries" :key="entry.key"><a class="fh-error-summary__link" :href="`#${entry.id}`" @click.prevent="showField(entry.key)">{{ entry.text }}</a></li>
        </ul>
      </template>
    </div>

    <component
      :is="props.actionsComponent"
      v-if="props.actionsComponent"
      v-bind="actions"
      :loading="disabled"
      :values="actionValues(form.engine)"
      @submit="onSubmit"
      @next="onNext"
      @back="onBack"
      @cancel="onCancel"
      @skip="onSkip"
      @primary="onPrimary"
    />
  </form>
</template>
