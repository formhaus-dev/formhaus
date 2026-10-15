import { canMoveFocus, errorDomId, focusField, restoreFocus } from '@formhaus/core/internal';
import { nextTick, ref, watch, type Ref } from 'vue';
import type { UseFormEngineReturn } from './useFormEngine';

export function useFormFocus(
  form: UseFormEngineReturn,
  formRef: Ref<HTMLFormElement | undefined>,
  formId: string,
  invalidAttempts: Ref<number>,
) {
  const { currentStep, stepValidating, submitting } = form;
  const requested = ref(0);
  let previousStep = currentStep.value?.id;
  let focusPending = false;
  let focusKey: string | null = null;
  let focusReturn: HTMLElement | null = null;
  let wasBusy = false;
  let handledInvalid = 0;
  let handledRequest = 0;

  watch(
    [currentStep, stepValidating, submitting, invalidAttempts, requested],
    async () => {
      if (currentStep.value?.id !== previousStep || invalidAttempts.value !== handledInvalid || requested.value !== handledRequest)
        focusPending = true;
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
        if (restore) restoreFocus(formRef.value, focusReturn);
        return;
      }
      focusPending = false;
      await nextTick();
      const key = focusKey;
      focusKey = null;
      focusField(formRef.value, key && errorDomId(form.engine, formId, key));
    },
    { flush: 'post' },
  );

  return {
    rememberFocus(event: FocusEvent) {
      focusReturn = event.target as HTMLElement;
    },
    requestFocus() {
      if (canMoveFocus(formRef.value)) requested.value++;
    },
    showField(key: string) {
      focusKey = key;
      requested.value++;
      form.engine.goToStepWithField(key);
    },
  };
}
