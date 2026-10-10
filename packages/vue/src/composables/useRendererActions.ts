import { evaluateCondition } from '@formhaus/core';
import { ref, watch } from 'vue';
import type { FormRendererEmits, FormRendererProps } from '../types';
import type { UseFormEngineReturn } from './useFormEngine';

export function useRendererActions(form: UseFormEngineReturn, props: FormRendererProps, emit: FormRendererEmits) {
  const actionError = ref<string | null>(null);
  watch(() => form.engine, () => { actionError.value = null; });
  async function run(action: () => Promise<boolean>) {
    if (props.loading) return;
    const owner = form.engine;
    const onError = props.onError;
    actionError.value = null;
    try { await action(); }
    catch (error) {
      if (owner !== form.engine) return;
      if (onError) onError(error);
      else actionError.value = error instanceof Error ? error.message : 'Form action failed';
    }
  }
  const next = () => run(() => form.engine.nextStepAsync());
  const prev = () => run(() => form.engine.prevStepAsync());
  function update(key: string, value: unknown) {
    if (props.loading || form.engine.stepValidating || form.engine.submitting) return;
    form.engine.setValue(key, value);
    emit('fieldChange', key, value, form.engine.values);
  }
  function commit(key: string, value: unknown) {
    const engine = form.engine;
    if (props.loading || engine.stepValidating || engine.submitting) return;
    const step = engine.currentStep;
    const field = engine.visibleFields.find((field) => field.key === key);
    if (!field) return;
    update(key, value);
    if (field.autoAdvance && engine.currentStep?.id === step?.id && !engine.isLastStep) void run(() => engine.nextStepAsync('autoAdvance'));
  }
  function send(engine: typeof form.engine, handler: typeof props.submitHandler) {
    return async (values: Record<string, unknown>, skippedSteps?: string[]) => {
      emit('analyticsEvent', { type: 'form_submitted', fieldCount: Object.keys(values).length });
      if (handler) await handler(values, skippedSteps);
      if (engine === form.engine) emit('submit', values);
    };
  }
  async function report(engine: typeof form.engine, action: Promise<boolean>) {
    const result = await action;
    if (!result) {
      for (const [fieldKey, error] of Object.entries(engine.errors)) {
        emit('analyticsEvent', { type: 'field_error', fieldKey, error });
      }
    }
    return result;
  }
  const submit = () => run(async () => {
    const engine = form.engine;
    if (engine.definition.submit.disabled?.every((condition) => evaluateCondition(condition, engine.values))
      && engine.definition.submit.disabled.length > 0) return false;
    return report(engine, engine.submitAsync(send(engine, props.submitHandler)));
  });
  const skip = () => run(() => {
    const engine = form.engine;
    const submit = send(engine, props.submitHandler);
    return report(engine, engine.skipStepAsync((values, skippedSteps) => {
      emit('analyticsEvent', { type: 'step_skipped', stepId: engine.currentStep!.id });
      return submit(values, skippedSteps);
    }));
  });
  return { update, commit, next, prev, skip, submit, actionError };
}
