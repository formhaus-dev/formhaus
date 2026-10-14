import { fieldDomId } from '@formhaus/core/internal';
import { nextTick, ref, watch, type Ref } from 'vue';
import type { UseFormEngineReturn } from './useFormEngine';

const CONTROLS = 'input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)';

function firstControl(root: Element | null | undefined) {
  return root?.matches(CONTROLS) ? root : root?.querySelector(CONTROLS);
}

export function useFormFocus(form: UseFormEngineReturn, formRef: Ref<HTMLFormElement | undefined>, formId: string, invalidAttempts: Ref<number>) {
  const { currentStep, stepValidating, submitting } = form;
  const requested = ref(0);
  let previousStep = currentStep.value?.id;
  let focusPending = false;
  let focusKey: string | null = null;
  let focusReturn: HTMLElement | null = null;
  let wasBusy = false;
  let handledInvalid = 0;
  let handledRequest = 0;

  watch([currentStep, stepValidating, submitting, invalidAttempts, requested], async () => {
    if (currentStep.value?.id !== previousStep || invalidAttempts.value !== handledInvalid || requested.value !== handledRequest) focusPending = true;
    previousStep = currentStep.value?.id;
    handledInvalid = invalidAttempts.value;
    handledRequest = requested.value;
    if (stepValidating.value || submitting.value) {
      wasBusy = true;
      return;
    }
    const restore = wasBusy;
    wasBusy = false;
    if (!focusPending) {
      const document = formRef.value?.ownerDocument;
      if (restore && document?.activeElement === document?.body && focusReturn?.isConnected) focusReturn.focus();
      return;
    }
    focusPending = false;
    await nextTick();
    const fields = formRef.value?.querySelector('.fh-form__fields');
    const id = focusKey && fieldDomId(formId, focusKey);
    focusKey = null;
    const chosen = id ? fields?.querySelector(`[id="${id}"], [id="${id}-error"]`) : null;
    if (id && !chosen) return;
    const field = chosen?.closest('.fh-field') ?? chosen ?? fields?.querySelector('[aria-invalid="true"]');
    const target = field?.querySelector('input:checked:not(:disabled)') ?? firstControl(field) ?? firstControl(fields);
    ((target as HTMLElement | null | undefined) ?? formRef.value)?.focus();
  }, { flush: 'post' });

  return {
    rememberFocus(event: FocusEvent) { focusReturn = event.target as HTMLElement; },
    showField(key: string) {
      focusKey = key;
      requested.value++;
      form.engine.goToStepWithField(key);
    },
  };
}
