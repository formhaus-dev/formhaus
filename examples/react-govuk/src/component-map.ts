import type { FieldComponentMap, LayoutComponentMap } from '@formhaus/react';
import { CheckboxField } from './fields/CheckboxField';
import { DateField } from './fields/DateField';
import { FileField } from './fields/FileField';
import { InputField } from './fields/InputField';
import { RadioField } from './fields/RadioField';
import { SelectField } from './fields/SelectField';
import { TextareaField } from './fields/TextareaField';
import { ConfirmDialog, Group, GroupItem, Section } from './layout/Containers';
import { ErrorSummary } from './layout/ErrorSummary';
import { FormActions } from './layout/FormActions';
import { FormErrors } from './layout/FormErrors';
import { StepProgress } from './layout/StepProgress';

export const components: FieldComponentMap = {
  text: InputField,
  email: InputField,
  phone: InputField,
  password: InputField,
  number: InputField,
  time: InputField,
  datetime: InputField,
  date: DateField,
  textarea: TextareaField,
  select: SelectField,
  autocomplete: SelectField,
  multiselect: CheckboxField,
  checkbox: CheckboxField,
  switch: CheckboxField,
  radio: RadioField,
  scale: RadioField,
  rating: RadioField,
  file: FileField,
  hidden: () => null,
};

export const layout: LayoutComponentMap = {
  actions: FormActions,
  progress: StepProgress,
  errorSummary: ErrorSummary,
  formErrors: FormErrors,
  section: Section,
  group: Group,
  groupItem: GroupItem,
  confirmDialog: ConfirmDialog,
};
