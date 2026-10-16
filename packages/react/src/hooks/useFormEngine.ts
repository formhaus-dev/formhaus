import { FormEngine, type FormEngineOptions, type FormDefinition } from '@formhaus/core';
import { warnDefinitionReset } from '@formhaus/core/internal';
import { useEffect, useRef } from 'react';
import { useFormSnapshot } from './useEngineSnapshot';

export function useFormEngineStore(
  definition: FormDefinition,
  initialValues?: Record<string, unknown>,
  options?: FormEngineOptions,
): FormEngine {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const engineRef = useRef<FormEngine | null>(null);
  const definitionRef = useRef(definition);
  const warnedRef = useRef(false);

  if (engineRef.current === null || definitionRef.current !== definition) {
    if (engineRef.current !== null && !warnedRef.current && typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      warnedRef.current = warnDefinitionReset(definitionRef.current, definition, 'a constant or useMemo', options?.onWarning);
    }
    engineRef.current = new FormEngine(definition, initialValues, {
      validators: options?.validators,
      messages: options?.messages,
      get onStepValidate() {
        return optionsRef.current?.onStepValidate;
      },
      get onBeforeStepChange() {
        return optionsRef.current?.onBeforeStepChange;
      },
      get onAfterStepChange() {
        return optionsRef.current?.onAfterStepChange;
      },
      get onBeforeSubmit() {
        return optionsRef.current?.onBeforeSubmit;
      },
      get onAfterSubmit() {
        return optionsRef.current?.onAfterSubmit;
      },
      onWarning: options?.onWarning,
    });
    definitionRef.current = definition;
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
  useFormSnapshot(engine);
  return engine;
}
