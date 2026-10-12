import type { FormRendererProps } from '../types';

export interface FormhausFormProps extends Omit<FormRendererProps, 'definition' | 'onSubmit' | 'submitHandler' | 'errors'> {
  id: string;
  apiBase?: string;
}
