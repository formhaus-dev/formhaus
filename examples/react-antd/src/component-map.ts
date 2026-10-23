import type { FieldComponentMap, LayoutComponentMap } from '@formhaus/react';
import { CheckboxField, RadioField, RatingField, ScaleField, SelectField, SwitchField } from './fields/ChoiceFields';
import { HiddenField, NumberField, TextareaField, TextField } from './fields/InputFields';
import { DateField, FileField } from './fields/PickerFields';
import { ConfirmDialog, FormActions, Group, GroupItem, Section } from './layout/Containers';
import { ErrorSummary, FormErrors, StepProgress } from './layout/Feedback';

export const components: FieldComponentMap = {
  text: TextField,
  email: TextField,
  phone: TextField,
  password: TextField,
  number: NumberField,
  textarea: TextareaField,
  select: SelectField,
  multiselect: SelectField,
  autocomplete: SelectField,
  radio: RadioField,
  checkbox: CheckboxField,
  switch: SwitchField,
  scale: ScaleField,
  rating: RatingField,
  date: DateField,
  time: DateField,
  datetime: DateField,
  file: FileField,
  hidden: HiddenField,
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
