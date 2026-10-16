import { isActionDisabled } from '@formhaus/core';
import { autoAdvance } from '@formhaus/core/internal';
import { ref, watch } from 'vue';
import type { FormRendererEmits, FormRendererProps } from '../types';
import type { UseFormEngineReturn } from './useFormEngine';

export function useRendererActions(form: UseFormEngineReturn, props: FormRendererProps, emit: FormRendererEmits) {
  const actionError = ref<string | null>(null);
  const invalidAttempts = ref(0);
  watch(
    () => form.engine,
    () => {
      actionError.value = null;
    },
  );
  async function run(action: () => Promise<boolean>) {
    if (props.loading) return;
    const owner = form.engine;
    const onError = props.onError;
    const errors = owner.errors;
    actionError.value = null;
    try {
      if (!(await action()) && owner === form.engine && owner.errors !== errors && Object.keys(owner.errors).length > 0)
        invalidAttempts.value++;
    } catch (error) {
      if (owner !== form.engine) return;
      if (onError) onError(error);
      else actionError.value = error instanceof Error ? error.message : 'Form action failed';
    }
  }
  const next = () =>
    run(async () => {
      const engine = form.engine;
      return !isActionDisabled(engine.isLastStep ? undefined : engine.currentStep?.next, engine.getSubmitValues()) && engine.next();
    });
  const prev = () => run(() => form.engine.back());
  function update(key: string, value: unknown) {
    if (props.loading || form.engine.stepValidating || form.engine.submitting) return;
    form.engine.setValue(key, value);
    emit('fieldChange', key, value, form.engine.values);
  }
  function changeItems(key: string, apply: () => boolean) {
    const engine = form.engine;
    if (props.loading || engine.stepValidating || engine.submitting || !apply()) return false;
    emit('fieldChange', key, engine.values[key], engine.values);
    return true;
  }
  function commit(key: string, value: unknown) {
    const engine = form.engine;
    if (props.loading || engine.stepValidating || engine.submitting) return;
    const step = engine.currentStep;
    const field = engine.visibleFields.find((field) => field.key === key);
    if (!field) return;
    update(key, value);
    if (field.autoAdvance && engine.currentStep?.id === step?.id && !engine.isLastStep) void run(() => autoAdvance(engine));
  }
  function send(handler: typeof props.submitHandler) {
    return async (values: Record<string, unknown>, skippedSteps: string[]) => {
      emit('analyticsEvent', { type: 'form_submitted', fieldCount: Object.keys(values).length });
      return handler?.(values, skippedSteps);
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
  const submit = () =>
    run(async () => {
      const engine = form.engine;
      if (isActionDisabled(engine.definition.submit, engine.getSubmitValues())) return false;
      return report(engine, engine.submit(send(props.onSubmit ?? props.submitHandler)));
    });
  const skip = () =>
    run(() => {
      const engine = form.engine;
      const submit = send(props.onSubmit ?? props.submitHandler);
      return report(
        engine,
        engine.skip((values, skippedSteps) => {
          emit('analyticsEvent', { type: 'step_skipped', stepId: engine.currentStep!.id });
          return submit(values, skippedSteps);
        }),
      );
    });
  return { update, changeItems, commit, next, prev, skip, submit, actionError, invalidAttempts };
}
