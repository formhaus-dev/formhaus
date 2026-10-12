import type { DraftStore, PublishedForm } from '@formhaus/core/cloud';
import type { FormRendererProps } from '../types';

export interface FormhausFormProps extends Omit<FormRendererProps, 'definition' | 'onSubmit' | 'submitHandler' | 'errors'> {
  id: string;
  apiBase?: string;
  initialForm?: PublishedForm;
  draftStore?: DraftStore;
}
