import {
  FormEngine,
  type FormEngineOptions,
  type FormField,
  type FormDefinition,
  type FormStep,
} from '@formhaus/core';
import { type ComputedRef, type Ref, computed, ref, watch } from 'vue';

export interface UseFormEngineReturn {
  engine: FormEngine;
  values: ComputedRef<Record<string, unknown>>;
  errors: ComputedRef<Record<string, string>>;
  topLevelErrors: ComputedRef<string[]>;
  fieldLoading: ComputedRef<Record<string, boolean>>;
  visibleFields: ComputedRef<FormField[]>;
  visibleSteps: ComputedRef<FormStep[]>;
  currentStep: ComputedRef<FormStep | null>;
  isFirstStep: ComputedRef<boolean>;
  isLastStep: ComputedRef<boolean>;
  canGoNext: ComputedRef<boolean>;
  progress: ComputedRef<{ current: number; total: number }>;
  isMultiStep: ComputedRef<boolean>;
  stepValidating: ComputedRef<boolean>;
}

export function useFormEngine(
  definitionOrGetter: FormDefinition | (() => FormDefinition),
  initialValues?: Record<string, unknown>,
  options?: FormEngineOptions,
): UseFormEngineReturn {
  const getDefinition = typeof definitionOrGetter === 'function' ? definitionOrGetter : () => definitionOrGetter;
  const version = ref(0);
  let engine = new FormEngine(getDefinition(), initialValues, options);
  engine.subscribe(() => { version.value++; });

  const engineRef = ref(engine) as Ref<FormEngine>;

  watch(
    () => getDefinition().id,
    () => {
      engine = new FormEngine(getDefinition(), initialValues, options);
      engine.subscribe(() => { version.value++; });
      engineRef.value = engine;
      version.value++;
    },
  );

  return {
    get engine() { return engineRef.value; },
    values: computed(() => { version.value; return engineRef.value.values; }),
    errors: computed(() => { version.value; return engineRef.value.errors; }),
    topLevelErrors: computed(() => { version.value; return engineRef.value.topLevelErrors; }),
    fieldLoading: computed(() => { version.value; return engineRef.value.fieldLoading; }),
    visibleFields: computed(() => { version.value; return engineRef.value.visibleFields; }),
    visibleSteps: computed(() => { version.value; return engineRef.value.visibleSteps; }),
    currentStep: computed(() => { version.value; return engineRef.value.currentStep; }),
    isFirstStep: computed(() => { version.value; return engineRef.value.isFirstStep; }),
    isLastStep: computed(() => { version.value; return engineRef.value.isLastStep; }),
    canGoNext: computed(() => { version.value; return engineRef.value.canGoNext; }),
    progress: computed(() => { version.value; return engineRef.value.progress; }),
    isMultiStep: computed(() => { version.value; return engineRef.value.isMultiStep; }),
    stepValidating: computed(() => { version.value; return engineRef.value.stepValidating; }),
  };
}
