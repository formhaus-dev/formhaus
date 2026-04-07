import { FormEngine, type FormEngineOptions, type FormSchema } from '@formhaus/core';
import { useRef, useSyncExternalStore } from 'react';

export function useFormEngine(
  schema: FormSchema,
  initialValues?: Record<string, unknown>,
  options?: FormEngineOptions,
): FormEngine {
  const engineRef = useRef<FormEngine | null>(null);
  const schemaIdRef = useRef<string>(schema.id);

  if (engineRef.current === null || schemaIdRef.current !== schema.id) {
    engineRef.current = new FormEngine(schema, initialValues, options);
    schemaIdRef.current = schema.id;
  }

  const engine = engineRef.current;

  useSyncExternalStore(engine.subscribe.bind(engine), engine.getSnapshot.bind(engine));

  return engine;
}
