import { FormEngine, type FormEngineOptions, type FormDefinition } from '@formhaus/core';
import { useRef, useSyncExternalStore } from 'react';

export function useFormEngine(
  definition: FormDefinition,
  initialValues?: Record<string, unknown>,
  options?: FormEngineOptions,
): FormEngine {
  const engineRef = useRef<FormEngine | null>(null);
  const definitionIdRef = useRef<string>(definition.id);

  if (engineRef.current === null || definitionIdRef.current !== definition.id) {
    engineRef.current = new FormEngine(definition, initialValues, options);
    definitionIdRef.current = definition.id;
  }

  const engine = engineRef.current;

  useSyncExternalStore(engine.subscribe.bind(engine), engine.getSnapshot.bind(engine));

  return engine;
}
