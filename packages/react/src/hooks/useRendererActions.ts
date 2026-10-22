import { isActionDisabled, type FormEngine } from '@formhaus/core';
import { actionValues, autoAdvance } from '@formhaus/core/internal';
import { useCallback, useState } from 'react';
import type { FormRendererProps } from '../types';

export function useRendererActions(engine: FormEngine, props: FormRendererProps) {
  const { loading, onError, onFieldChange, onSubmit } = props;
  const [failure, setFailure] = useState<{ engine: FormEngine; message: string } | null>(null);
  const [invalidAttempts, setInvalidAttempts] = useState(0);
  const run = useCallback(
    async (action: () => Promise<boolean>) => {
      if (loading) return;
      setFailure(null);
      const errors = engine.errors;
      try {
        if (!(await action()) && engine.errors !== errors && Object.keys(engine.errors).length > 0)
          setInvalidAttempts((count) => count + 1);
      } catch (error) {
        if (onError) onError(error);
        else setFailure({ engine, message: error instanceof Error ? error.message : 'Form action failed' });
      }
    },
    [engine, loading, onError],
  );
  const next = useCallback(
    () =>
      run(async () => !isActionDisabled(engine.isLastStep ? undefined : engine.currentStep?.next, actionValues(engine)) && engine.next()),
    [run, engine],
  );
  const back = useCallback(() => run(() => engine.back()), [run, engine]);
  const update = useCallback(
    (key: string, value: unknown) => {
      if (loading || engine.stepValidating || engine.submitting) return;
      engine.setValue(key, value);
      onFieldChange?.(key, value, engine.values);
    },
    [engine, loading, onFieldChange],
  );
  const changeItems = useCallback(
    (key: string, apply: () => boolean) => {
      if (loading || engine.stepValidating || engine.submitting || !apply()) return false;
      onFieldChange?.(key, engine.values[key], engine.values);
      return true;
    },
    [engine, loading, onFieldChange],
  );
  const commit = useCallback(
    (key: string, value: unknown) => {
      if (loading || engine.stepValidating || engine.submitting) return;
      const step = engine.currentStep;
      const field = engine.visibleFields.find((field) => field.key === key);
      if (!field) return;
      update(key, value);
      if (field.autoAdvance && engine.currentStep?.id === step?.id && !engine.isLastStep) void run(() => autoAdvance(engine));
    },
    [engine, loading, run, update],
  );
  const submit = useCallback(
    () => run(async () => !isActionDisabled(engine.definition.submit, actionValues(engine)) && engine.submit(onSubmit)),
    [engine, run, onSubmit],
  );
  const skip = useCallback(() => run(() => engine.skip(onSubmit)), [run, engine, onSubmit]);
  const actionError = failure?.engine === engine ? failure.message : null;
  return { next, back, skip, update, changeItems, commit, submit, actionError, invalidAttempts };
}
