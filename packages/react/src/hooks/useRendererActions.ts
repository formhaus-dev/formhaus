import { isActionDisabled, type FormEngine } from '@formhaus/core';
import { autoAdvance } from '@formhaus/core/internal';
import { useCallback, useState } from 'react';
import type { FormRendererProps } from '../types';

export function useRendererActions(engine: FormEngine, props: FormRendererProps) {
  const { loading, onError, onFieldChange, onSubmit, onAnalyticsEvent } = props;
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
      run(
        async () => !isActionDisabled(engine.isLastStep ? undefined : engine.currentStep?.next, engine.getSubmitValues()) && engine.next(),
      ),
    [run, engine],
  );
  const prev = useCallback(() => run(() => engine.back()), [run, engine]);
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
  const send = useCallback(
    async (values: Record<string, unknown>, skippedSteps: string[]) => {
      onAnalyticsEvent?.({ type: 'form_submitted', fieldCount: Object.keys(values).length });
      return onSubmit(values, skippedSteps);
    },
    [onSubmit, onAnalyticsEvent],
  );
  const report = useCallback(
    async (action: Promise<boolean>) => {
      const result = await action;
      if (!result) {
        for (const [key, error] of Object.entries(engine.errors)) {
          onAnalyticsEvent?.({ type: 'field_error', fieldKey: key, error });
        }
      }
      return result;
    },
    [engine, onAnalyticsEvent],
  );
  const submit = useCallback(
    () => run(async () => !isActionDisabled(engine.definition.submit, engine.getSubmitValues()) && report(engine.submit(send))),
    [engine, run, send, report],
  );
  const skip = useCallback(
    () =>
      run(() =>
        report(
          engine.skip((values, skippedSteps) => {
            onAnalyticsEvent?.({ type: 'step_skipped', stepId: engine.currentStep!.id });
            return send(values, skippedSteps);
          }),
        ),
      ),
    [run, engine, send, report, onAnalyticsEvent],
  );
  const actionError = failure?.engine === engine ? failure.message : null;
  return { next, prev, skip, update, changeItems, commit, submit, actionError, invalidAttempts };
}
