<script setup lang="ts">
import { isSection, type FormEngineOptions, type FormField, type LabelKey, type StepChangeContext } from '@formhaus/core';
import { applySources, errorEntries, labelFor, shouldApplyExternalErrors, warnMissingComponents } from '@formhaus/core/internal';
import { computed, onMounted, ref, watch } from 'vue';
import FieldResolver from './FieldResolver.vue';
import FormGroup from './FormGroup.vue';
import DefaultSection from './DefaultSection.vue';
import { useFormFocus } from './composables/useFormFocus';
import { useFormId } from './composables/useFormId';
import { useRendererActions } from './composables/useRendererActions';
import { useFormEngine } from './composables/useFormEngine';
import { useNodeProps } from './composables/useNodeProps';
import type { FormRendererEmits, FormRendererProps } from './types';

const props = withDefaults(defineProps<FormRendererProps>(), { loading: false, headingLevel: 2, confirmRemove: true });

const emit = defineEmits<FormRendererEmits>();

const formId = useFormId();
const formRef = ref<HTMLFormElement>();
const engineOptions: FormEngineOptions = {
  validators: props.validators,
  onWarning: props.onWarning,
  get messages() {
    return props.messages;
  },
  get onStepValidate() {
    return props.onStepValidate;
  },
  get onBeforeStepChange() {
    return props.onBeforeStepChange;
  },
  get onBeforeSubmit() {
    return props.onBeforeSubmit;
  },
  get onAfterSubmit() {
    return props.onAfterSubmit;
  },
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

onMounted(() => applySources(form.engine, props.initialValues));
watch(
  () => form.engine,
  (engine) => applySources(engine, props.initialValues),
);

const warned = new Set<string>();
watch(
  [() => props.definition, () => props.components],
  ([definition, components]) => warnMissingComponents(definition, components, warned, props.onWarning),
  { immediate: true },
);

const {
  update: onFieldUpdate,
  changeItems: onItemsChange,
  commit: onFieldCommit,
  next: onNext,
  prev: onPrev,
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

const summaryEntries = computed(() => {
  errors.value;
  progress.value;
  return errorEntries(form.engine, formId, props.labels, props.definition.labels);
});
const stepStatuses = computed(() => {
  if (!props.stepErrorMarks) return undefined;
  progress.value;
  const marks = form.engine.stepErrors;
  return form.visibleSteps.value.map(({ id, title }) => ({ id, title, errorCount: marks[id]?.length ?? 0 }));
});

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

const disabled = computed(() => props.loading || stepValidating.value || submitting.value);

const { nodeProps, sectionProps } = useNodeProps(form, props, formId, disabled, {
  update: onFieldUpdate,
  commit: onFieldCommit,
  changeItems: onItemsChange,
  blur: onFieldBlur,
  focus: onFieldFocus,
});

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

    <div v-if="props.errorSummary && summaryEntries.length > 0" class="fh-error-summary" role="alert">
      <strong class="fh-error-summary__title">{{ label('errorSummary') }}</strong>
      <ul class="fh-error-summary__list">
        <li v-for="entry in summaryEntries" :key="entry.key">
          <a class="fh-error-summary__link" :href="`#${entry.id}`" @click.prevent="showField(entry.key)">{{ entry.label }}: {{ entry.message }}</a>
        </li>
      </ul>
    </div>

    <div class="fh-form__fields">
      <template v-for="node in visibleNodes" :key="node.key">
        <component :is="props.components?.section ?? DefaultSection" v-if="isSection(node)" v-bind="sectionProps(node)">
          <component :is="child.type === 'group' ? FormGroup : FieldResolver" v-for="child in node.fields" :key="child.key" v-bind="nodeProps(child)" />
        </component>
        <component :is="node.type === 'group' ? FormGroup : FieldResolver" v-else v-bind="nodeProps(node as FormField)" />
      </template>
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
