import type { FormEvent } from '@formhaus/core';
import { useListening } from './useListening';
import type { UseFormEngineOptions } from './useFormEngine';
import type { FormRendererProps } from '../types';

export function useEngineOptions(props: FormRendererProps, onFormEvent: (event: FormEvent) => void): UseFormEngineOptions {
  const listening = useListening();
  return {
    get keepValues() {
      return props.keepValues;
    },
    get onFormEvent() {
      return listening('onFormEvent', 'onAnalyticsEvent') ? onFormEvent : undefined;
    },
    validators: props.validators,
    onWarning: props.onWarning,
    get messages() {
      return props.messages;
    },
    get onStepValidate() {
      return props.onStepValidate;
    },
    get onBeforeStepChange() {
      return props.onBeforeStepChange;
    },
    get onBeforeSubmit() {
      return props.onBeforeSubmit;
    },
    get onAfterSubmit() {
      return props.onAfterSubmit;
    },
    get onAfterStepChange() {
      return props.onAfterStepChange;
    },
  };
}
