import type { LayoutComponentMap } from '@formhaus/react';
import { ConfirmDialog } from './ConfirmDialog';
import { FieldsContainer, Group, GroupItem, Section } from './Containers';
import { ErrorSummary } from './ErrorSummary';
import { FormActions } from './FormActions';
import { FormErrors } from './FormErrors';
import { StepProgress } from './StepProgress';

export const layout: LayoutComponentMap = {
  fields: FieldsContainer,
  section: Section,
  group: Group,
  groupItem: GroupItem,
  confirmDialog: ConfirmDialog,
  errorSummary: ErrorSummary,
  formErrors: FormErrors,
  progress: StepProgress,
  actions: FormActions,
};
