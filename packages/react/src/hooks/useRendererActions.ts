import { evaluateCondition } from '@formhaus/core';
import type { FormEngine } from '@formhaus/core';
import { useCallback, useState } from 'react';
import type { FormRendererProps } from '../types';

export function useRendererActions(engine: FormEngine, props: FormRendererProps) {
  const { loading, onError, onFieldChange, onSubmit, onAnalyticsEvent } = props;
  const [failure, setFailure] = useState<{ engine: FormEngine; message: string } | null>(null);
  const run = useCallback(async (action: () => Promise<boolean>) => {
    if (loading) return;
    setFailure(null);
    try { await action(); }
    catch (error) {
      if (onError) onError(error);
      else setFailure({ engine, message: error instanceof Error ? error.message : 'Form action failed' });
    }
  }, [engine, loading, onError]);
  const next = useCallback(() => run(() => engine.nextStepAsync()), [run, engine]);
  const prev = useCallback(() => run(() => engine.prevStepAsync()), [run, engine]);
  const update = useCallback((key: string, value: unknown) => {
    if (loading || engine.stepValidating || engine.submitting) return;
    engine.setValue(key, value);
    onFieldChange?.(key, value, engine.values);
  }, [engine, loading, onFieldChange]);
  const commit = useCallback((key: string, value: unknown) => {
    if (loading || engine.stepValidating || engine.submitting) return;
    const step = engine.currentStep;
    const field = engine.visibleFields.find((field) => field.key === key);
    if (!field) return;
    update(key, value);
    if (field.autoAdvance && engine.currentStep?.id === step?.id && !engine.isLastStep) void run(() => engine.nextStepAsync('autoAdvance'));
  }, [engine, loading, run, update]);
  const submit = useCallback(() => run(async () => {
    if (engine.definition.submit.disabled?.every((condition) => evaluateCondition(condition, engine.values))
      && engine.definition.submit.disabled.length > 0) return false;
    const result = await engine.submitAsync(async (values) => {
      onAnalyticsEvent?.({ type: 'form_submitted', fieldCount: Object.keys(values).length });
      await onSubmit(values);
    });
    if (!result) {
      for (const [key, error] of Object.entries(engine.errors)) {
        onAnalyticsEvent?.({ type: 'field_error', fieldKey: key, error });
      }
    }
    return result;
  }), [engine, run, onSubmit, onAnalyticsEvent]);
  const actionError = failure?.engine === engine ? failure.message : null;
  return { next, prev, update, commit, submit, actionError };
}
