import type { LayoutComponentMap } from '@formhaus/vue';
import ConfirmDialog from './ConfirmDialog.vue';
import ErrorSummary from './ErrorSummary.vue';
import FieldsContainer from './FieldsContainer.vue';
import FormActions from './FormActions.vue';
import FormErrors from './FormErrors.vue';
import FormGroup from './FormGroup.vue';
import FormSection from './FormSection.vue';
import GroupItem from './GroupItem.vue';
import StepProgress from './StepProgress.vue';

export const layout: LayoutComponentMap = {
  fields: FieldsContainer,
  section: FormSection,
  group: FormGroup,
  groupItem: GroupItem,
  confirmDialog: ConfirmDialog,
  errorSummary: ErrorSummary,
  formErrors: FormErrors,
  progress: StepProgress,
  actions: FormActions,
};
