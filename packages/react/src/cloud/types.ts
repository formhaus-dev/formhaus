import type { CloudSubmission } from '@formhaus/core/cloud';
import type { ReactNode } from 'react';
import type { FormRendererProps } from '../types';

export interface FormhausFormProps extends Omit<FormRendererProps, 'definition' | 'onSubmit' | 'errors'> {
  id: string;
  apiBase?: string;
  onSuccess?: (submission: CloudSubmission) => void;
  fallback?: ReactNode;
  success?: ReactNode;
}
