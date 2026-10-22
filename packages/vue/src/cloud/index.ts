import type { EmitsOf, TypedComponent, WithSlots } from '../types';
import FormhausFormComponent from './FormhausForm.vue';
import type { FormhausFormEvents, FormhausFormProps, FormhausFormSlots } from './types';

export const FormhausForm: WithSlots<
  TypedComponent<FormhausFormProps, EmitsOf<FormhausFormEvents>>,
  FormhausFormSlots
> = FormhausFormComponent;
export type { FormhausFormProps };
export { CloudError, type CloudLabelSource, type CloudNotice, type CloudNoticeActionFn, type CloudSubmission } from '@formhaus/core/cloud';
