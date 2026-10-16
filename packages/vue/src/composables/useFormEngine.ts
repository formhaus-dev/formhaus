import { FormEngine, type FormEngineOptions, type FormField, type FormNode, type FormDefinition, type FormStep } from '@formhaus/core';
import { warnDefinitionReset } from '@formhaus/core/internal';
import { type ComputedRef, computed, onScopeDispose, ref, shallowRef, watch } from 'vue';

export interface UseFormEngineReturn {
  engine: FormEngine;
  values: ComputedRef<Readonly<Record<string, unknown>>>;
  errors: ComputedRef<Readonly<Record<string, string>>>;
  topLevelErrors: ComputedRef<readonly string[]>;
  fieldLoading: ComputedRef<Readonly<Record<string, boolean>>>;
  visibleFields: ComputedRef<FormField[]>;
  visibleNodes: ComputedRef<FormNode[]>;
  visibleSteps: ComputedRef<FormStep[]>;
  currentStep: ComputedRef<FormStep | null>;
  isFirstStep: ComputedRef<boolean>;
  isLastStep: ComputedRef<boolean>;
  canGoNext: ComputedRef<boolean>;
  progress: ComputedRef<{ current: number; total: number }>;
  isMultiStep: ComputedRef<boolean>;
  stepValidating: ComputedRef<boolean>;
  submitting: ComputedRef<boolean>;
}

export function useFormEngine(
  definitionOrGetter: FormDefinition | (() => FormDefinition),
  initialValues?: Record<string, unknown> | (() => Record<string, unknown> | undefined),
  options?: FormEngineOptions,
): UseFormEngineReturn {
  const getDefinition = typeof definitionOrGetter === 'function' ? definitionOrGetter : () => definitionOrGetter;
  const getValues = typeof initialValues === 'function' ? initialValues : () => initialValues;
  const version = ref(0);
  let engine = new FormEngine(getDefinition(), getValues(), options);
  let unsubscribe = engine.subscribe(() => {
    version.value++;
  });

  const engineRef = shallowRef(engine);

  let warned = false;

  watch(getDefinition, (next, previous) => {
    let warn: (() => boolean) | undefined;
    try {
      if (!warned && process.env.NODE_ENV !== 'production')
        warn = () => warnDefinitionReset(previous, next, 'a constant or a computed', options?.onWarning);
    } catch {}
    if (warn) warned = warn();
    engine.cancelPendingActions();
    unsubscribe();
    engine = new FormEngine(getDefinition(), getValues(), options);
    unsubscribe = engine.subscribe(() => {
      version.value++;
    });
    engineRef.value = engine;
    version.value++;
  });

  onScopeDispose(() => {
    engine.cancelPendingActions();
    unsubscribe();
  });

  return {
    get engine() {
      return engineRef.value;
    },
    values: computed(() => {
      version.value;
      return engineRef.value.values;
    }),
    errors: computed(() => {
      version.value;
      return engineRef.value.errors;
    }),
    topLevelErrors: computed(() => {
      version.value;
      return engineRef.value.topLevelErrors;
    }),
    fieldLoading: computed(() => {
      version.value;
      return engineRef.value.fieldLoading;
    }),
    visibleFields: computed(() => {
      version.value;
      return engineRef.value.visibleFields;
    }),
    visibleNodes: computed(() => {
      version.value;
      return engineRef.value.visibleNodes;
    }),
    visibleSteps: computed(() => {
      version.value;
      return engineRef.value.visibleSteps;
    }),
    currentStep: computed(() => {
      version.value;
      return engineRef.value.currentStep;
    }),
    isFirstStep: computed(() => {
      version.value;
      return engineRef.value.isFirstStep;
    }),
    isLastStep: computed(() => {
      version.value;
      return engineRef.value.isLastStep;
    }),
    canGoNext: computed(() => {
      version.value;
      return engineRef.value.canGoNext;
    }),
    progress: computed(() => {
      version.value;
      return engineRef.value.progress;
    }),
    isMultiStep: computed(() => {
      version.value;
      return engineRef.value.isMultiStep;
    }),
    submitting: computed(() => {
      version.value;
      return engineRef.value.submitting;
    }),
    stepValidating: computed(() => {
      version.value;
      return engineRef.value.stepValidating;
    }),
  };
}
