import { FormEngine, type FormEngineOptions, type FormDefinition } from '@formhaus/core';
import { warnDefinitionReset } from '@formhaus/core/internal';
import { useEffect, useRef } from 'react';
import { useFormSnapshot } from './useEngineSnapshot';

export interface UseFormEngineOptions extends FormEngineOptions {
  keepValues?: boolean;
}

export function useFormEngineStore(
  definition: FormDefinition,
  initialValues?: Record<string, unknown>,
  options?: UseFormEngineOptions,
): FormEngine {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const engineRef = useRef<FormEngine | null>(null);
  const warnedRef = useRef(false);
  const previous = engineRef.current?.definition;

  if (!previous || (previous !== definition && !options?.keepValues)) {
    let warn: (() => boolean) | undefined;
    try {
      if (previous && !warnedRef.current && process.env.NODE_ENV !== 'production')
        warn = () => warnDefinitionReset(previous, definition, 'a constant or useMemo', options?.onWarning);
    } catch {}
    if (warn) warnedRef.current = warn();
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
      get onFormEvent() {
        return optionsRef.current?.onFormEvent;
      },
      onWarning: options?.onWarning,
    });
  }

  const engine = engineRef.current!;
  useEffect(() => () => engine.cancelPendingActions(), [engine]);
  useEffect(() => {
    if (engine.definition !== definition) engine.replaceDefinition(definition);
  }, [engine, definition]);
  return engine;
}

export function useFormEngine(
  definition: FormDefinition,
  initialValues?: Record<string, unknown>,
  options?: UseFormEngineOptions,
): FormEngine {
  const engine = useFormEngineStore(definition, initialValues, options);
  useFormSnapshot(engine);
  return engine;
}
