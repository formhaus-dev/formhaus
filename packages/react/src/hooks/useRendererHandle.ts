import { errorSummary, type FormEngine, type LabelSource } from '@formhaus/core';
import { type ForwardedRef, type RefObject, useImperativeHandle, useMemo, useRef } from 'react';
import { shownFormErrors } from '../FormTopLevelErrors';
import type { FormRendererHandle } from '../types';

interface HandleSource {
  formId: string;
  labels: RefObject<{ labels?: LabelSource }>;
  showField: (key: string) => void;
  submit: () => Promise<boolean>;
  actionError: string | null;
}

export function useRendererHandle(ref: ForwardedRef<FormRendererHandle>, engine: FormEngine, source: HandleSource): void {
  const latest = useRef(source);
  latest.current = source;
  const handle = useMemo<FormRendererHandle>(
    () => ({
      setValue: (key, value) => engine.setValue(key, value),
      getValues: () => ({ ...engine.values }),
      goToStep: (stepId) => engine.goToStep(stepId),
      showField: (key) => latest.current.showField(key),
      getErrors: () => {
        const { formId, labels, actionError } = latest.current;
        return {
          ...errorSummary(engine, { idPrefix: formId, labels: labels.current?.labels }),
          topLevelErrors: shownFormErrors(engine, actionError),
        };
      },
      submit: () => latest.current.submit(),
      reset: (values) => engine.reset(values),
      get values() {
        return engine.values;
      },
      get submitting() {
        return engine.submitting;
      },
      get engine() {
        return engine;
      },
    }),
    [engine],
  );
  useImperativeHandle(ref, () => handle, [handle]);
}
