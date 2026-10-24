import type { LayoutComponentMap } from '@formhaus/react';
import { ConfirmDialog } from './ConfirmDialog';
import { ErrorSummary } from './ErrorSummary';
import { Fields } from './Fields';
import { FormActions } from './FormActions';
import { FormErrors } from './FormErrors';
import { Group, GroupItem } from './Group';
import { Section } from './Section';
import { StepProgress } from './StepProgress';

export const layout: LayoutComponentMap = {
  fields: Fields,
  actions: FormActions,
  progress: StepProgress,
  errorSummary: ErrorSummary,
  formErrors: FormErrors,
  section: Section,
  group: Group,
  groupItem: GroupItem,
  confirmDialog: ConfirmDialog,
};
