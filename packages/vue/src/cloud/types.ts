import type { FormRendererProps } from '../types';

export interface FormhausFormProps extends Omit<FormRendererProps, 'definition' | 'submitHandler' | 'errors'> {
  id: string;
  apiBase?: string;
}
