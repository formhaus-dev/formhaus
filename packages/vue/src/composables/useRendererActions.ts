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
  const busy = () => props.loading || form.engine.stepValidating || form.engine.submitting;
  function update(key: string, value: unknown) {
    if (busy()) return;
    form.engine.setValue(key, value);
    emit('fieldChange', key, value, form.engine.values);
  }
  function changeItems(key: string, apply: () => boolean) {
    const engine = form.engine;
    if (busy() || !apply()) return false;
    emit('fieldChange', key, engine.values[key], engine.values);
    return true;
  }
  function commit(key: string, value: unknown) {
    if (busy()) return;
    const engine = form.engine;
    const step = engine.currentStep;
    const field = engine.visibleFields.find((field) => field.key === key);
    if (!field) return;
    update(key, value);
    if (field.autoAdvance && engine.currentStep?.id === step?.id && !engine.isLastStep) void run(() => autoAdvance(engine));
  }
  const handler = () => props.onSubmit ?? (() => {});
  const submit = () =>
    run(async () => {
      const engine = form.engine;
      return !isActionDisabled(engine.definition.submit, engine.getSubmitValues()) && engine.submit(handler());
    });
  const skip = () => run(() => form.engine.skip(handler()));
  return { update, changeItems, commit, next, prev, skip, submit, actionError, invalidAttempts };
}
