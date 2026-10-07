import { FormEngine, type FormEngineOptions, type FormDefinition } from '@formhaus/core';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

export function useFormEngineStore(
  definition: FormDefinition,
  initialValues?: Record<string, unknown>,
  options?: FormEngineOptions,
): FormEngine {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const engineRef = useRef<FormEngine | null>(null);
  const definitionIdRef = useRef<string>(definition.id);

  if (engineRef.current === null || definitionIdRef.current !== definition.id) {
    engineRef.current = new FormEngine(definition, initialValues, {
      validators: options?.validators,
      get onStepValidate() { return optionsRef.current?.onStepValidate; },
      get onBeforeStepChange() { return optionsRef.current?.onBeforeStepChange; },
      get onAfterStepChange() { return optionsRef.current?.onAfterStepChange; },
      get onBeforeSubmit() { return optionsRef.current?.onBeforeSubmit; },
      get onAfterSubmit() { return optionsRef.current?.onAfterSubmit; },
    });
    definitionIdRef.current = definition.id;
  }

  const engine = engineRef.current;
  useEffect(() => () => engine.cancelPendingActions(), [engine]);
  return engine;
}

export function useFormEngine(
  definition: FormDefinition,
  initialValues?: Record<string, unknown>,
  options?: FormEngineOptions,
): FormEngine {
  const engine = useFormEngineStore(definition, initialValues, options);

  const subscribe = useCallback((listener: () => void) => engine.subscribe(listener), [engine]);
  const getSnapshot = useCallback(() => engine.getSnapshot(), [engine]);

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return engine;
}
