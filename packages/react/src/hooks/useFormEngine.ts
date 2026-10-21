import { FormEngine, type FormEngineOptions, type FormDefinition } from '@formhaus/core';
import { refreshRecall, warnDefinitionReset } from '@formhaus/core/internal';
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
      get lang() {
        return optionsRef.current?.lang;
      },
      get formatRecall() {
        return optionsRef.current?.formatRecall;
      },
      onWarning: options?.onWarning,
      seed: options?.seed,
      research: options?.research,
    });
  }

  const engine = engineRef.current!;
  useEffect(() => () => engine.cancelPendingActions(), [engine]);
  const formatRecall = options?.formatRecall;
  const lang = options?.lang;
  const shown = useRef({ engine, formatRecall, lang });
  useEffect(() => {
    const previous = shown.current;
    shown.current = { engine, formatRecall, lang };
    if (previous.engine === engine && (previous.formatRecall !== formatRecall || previous.lang !== lang)) refreshRecall(engine);
  }, [engine, formatRecall, lang]);
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
