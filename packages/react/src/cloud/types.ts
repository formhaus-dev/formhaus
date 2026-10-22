import type { CloudLabelSource, CloudNoticeActionFn, CloudNotice, CloudSubmission, DraftStore, PublishedForm } from '@formhaus/core/cloud';
import type { ComponentType, ReactNode } from 'react';
import type { FormActionsProps, FormRendererProps } from '../types';

export interface FormhausFormActionsProps extends FormActionsProps {
  notice?: CloudNotice | null;
  onNoticeAction?: CloudNoticeActionFn;
}

export interface FormhausFormNoticeProps {
  notice: CloudNotice;
  onAction: CloudNoticeActionFn;
}

export interface FormhausFormProps
  extends Omit<FormRendererProps, 'definition' | 'onSubmit' | 'errors' | 'hiddenValues' | 'actionsComponent'> {
  id: string;
  apiBase?: string;
  initialForm?: PublishedForm;
  draftStore?: DraftStore | false;
  draftExclude?: string[];
  onSuccess?: (submission: CloudSubmission) => void;
  fallback?: ReactNode;
  success?: ReactNode;
  actionsComponent?: ComponentType<FormhausFormActionsProps>;
  cloudLabels?: CloudLabelSource;
  noticePlacement?: 'top' | 'actions';
  noticeComponent?: ComponentType<FormhausFormNoticeProps>;
}
