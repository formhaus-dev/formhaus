import type { CloudSubmission, DraftStore, PublishedForm } from '@formhaus/core/cloud';
import type { ReactNode } from 'react';
import type { FormRendererProps } from '../types';

export interface FormhausFormProps extends Omit<FormRendererProps, 'definition' | 'onSubmit' | 'errors' | 'hiddenValues'> {
  id: string;
  apiBase?: string;
  initialForm?: PublishedForm;
  draftStore?: DraftStore | false;
  draftExclude?: string[];
  onSuccess?: (submission: CloudSubmission) => void;
  fallback?: ReactNode;
  success?: ReactNode;
}
