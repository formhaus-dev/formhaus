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

  const read = <K extends keyof FormEngine>(key: K) =>
    computed(() => {
      version.value;
      return engineRef.value[key];
    });

  return {
    get engine() {
      return engineRef.value;
    },
    values: read('values'),
    errors: read('errors'),
    topLevelErrors: read('topLevelErrors'),
    fieldLoading: read('fieldLoading'),
    visibleFields: read('visibleFields'),
    visibleNodes: read('visibleNodes'),
    visibleSteps: read('visibleSteps'),
    currentStep: read('currentStep'),
    isFirstStep: read('isFirstStep'),
    isLastStep: read('isLastStep'),
    canGoNext: read('canGoNext'),
    progress: read('progress'),
    isMultiStep: read('isMultiStep'),
    submitting: read('submitting'),
    stepValidating: read('stepValidating'),
  };
}
