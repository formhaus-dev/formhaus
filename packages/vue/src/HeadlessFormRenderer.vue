<script setup lang="ts">
import { isSection, type FormEngineOptions, type FormField, type LabelKey, type StepChangeContext } from '@formhaus/core';
import {
  actionsView,
  applySources,
  errorEntries,
  labelFor,
  shouldApplyExternalErrors,
  warnMissingComponents,
} from '@formhaus/core/internal';
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
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

let stopValues = () => {};
let emitted: object;
const watchValues = (engine: typeof form.engine) => {
  stopValues();
  applySources(engine, props.initialValues);
  const changed = () => {
    if (values.value !== emitted) emit('valuesChange', (emitted = values.value));
  };
  changed();
  stopValues = engine.subscribeValues(changed);
};
onMounted(() => watchValues(form.engine));
watch(() => form.engine, watchValues);
onBeforeUnmount(() => stopValues());

let watchMissing: (() => void) | undefined;
try {
  if (process.env.NODE_ENV !== 'production') {
    const warned = new Set<string>();
    watchMissing = () => watchEffect(() => warnMissingComponents(props.definition, props.components, warned, props.onWarning));
  }
} catch {}
watchMissing?.();

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

defineExpose({
  setValue: (key: string, value: unknown) => form.engine.setValue(key, value),
  getValues: () => ({ ...form.engine.values }),
  values,
});

const label = (key: LabelKey, params: Record<string, unknown> = {}) => labelFor(key, params, props.labels, props.definition.labels);

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
          <component :is="child.type === 'group' ? FormGroup : FieldResolver" v-for="child in node.fields" :key="child.key" v-bind="nodeProps(child as FormField)" />
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
      v-bind="actions"
      :loading="disabled"
      :values="form.engine.getSubmitValues()"
      @submit="onSubmit"
      @next="onNext"
      @prev="onPrev"
      @cancel="onCancel"
      @skip="onSkip"
      @primary="onPrimary"
    />
  </form>
</template>
