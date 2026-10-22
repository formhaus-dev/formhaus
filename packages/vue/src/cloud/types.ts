import type { FormEvent } from '@formhaus/core';
import type { CloudLabelSource, CloudNotice, CloudNoticeActionFn, CloudSubmission, DraftStore, PublishedForm } from '@formhaus/core/cloud';
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

export interface FormhausFormSlots {
  fallback(): unknown;
  success(): unknown;
  notice(props: { notice: CloudNotice; onAction: CloudNoticeActionFn }): unknown;
}

export type FormhausFormEvents = {
  success: [submission: CloudSubmission];
  fieldChange: [key: string, value: unknown, values: Record<string, unknown>];
  formEvent: [event: FormEvent];
};
