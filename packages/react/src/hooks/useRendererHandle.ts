import { errorSummary, type FormEngine, type LabelSource } from '@formhaus/core';
import { type ForwardedRef, type RefObject, useImperativeHandle } from 'react';
import { shownFormErrors } from '../FormTopLevelErrors';
import type { FormRendererHandle } from '../types';

interface HandleSource {
  formId: string;
  labels: RefObject<{ labels?: LabelSource }>;
  showField: (key: string) => void;
  submit: () => Promise<boolean>;
  actionError: string | null;
}

export function useRendererHandle(
  ref: ForwardedRef<FormRendererHandle>,
  engine: FormEngine,
  { formId, labels, showField, submit, actionError }: HandleSource,
): void {
  useImperativeHandle(
    ref,
    () => ({
      setValue: (key, value) => engine.setValue(key, value),
      getValues: () => ({ ...engine.values }),
      goToStep: (stepId) => engine.goToStep(stepId),
      showField,
      getErrors: () => ({
        ...errorSummary(engine, { idPrefix: formId, labels: labels.current?.labels }),
        topLevelErrors: shownFormErrors(engine, actionError),
      }),
      submit,
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
    [engine, showField, formId, actionError, submit, labels],
  );
}
