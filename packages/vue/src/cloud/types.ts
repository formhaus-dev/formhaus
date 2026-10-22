import type { CloudLabelSource, DraftStore, PublishedForm } from '@formhaus/core/cloud';
import type { FormRendererProps } from '../types';

export interface FormhausFormProps extends Omit<FormRendererProps, 'definition' | 'onSubmit' | 'errors' | 'hiddenValues'> {
  id: string;
  apiBase?: string;
  initialForm?: PublishedForm;
  draftStore?: DraftStore | false;
  draftExclude?: string[];
  cloudLabels?: CloudLabelSource;
  noticePlacement?: 'top' | 'actions';
}
