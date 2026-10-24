import type { FieldComponentMap, FieldProps, LayoutComponentMap } from '@formhaus/react';
import { type ControlOption, mapControls } from '@formhaus/react/controls';
import { Checkbox, Choices, Input, Select, Textarea } from './fields/controls';
import { DateInput } from './fields/DateInput';
import { FileField } from './fields/FileField';
import { Shell } from './fields/Shell';
import { ConfirmDialog, Group, GroupItem, Section } from './layout/Containers';
import { ErrorSummary } from './layout/ErrorSummary';
import { FormActions } from './layout/FormActions';
import { FormErrors } from './layout/FormErrors';
import { StepProgress } from './layout/StepProgress';

const choices = (className?: string) => (f: FieldProps, options: ControlOption[]) => ({ f, options, className });
const points = choices('govuk-radios--inline govuk-radios--small');

export const components: FieldComponentMap = {
  ...mapControls({
    shell: Shell,
    kinds: { date: 'group' },
    matrix: mapControls({ shell: Shell, controls: { radio: [Choices, points] } }).radio,
    controls: {
      input: Input,
      date: DateInput,
      textarea: Textarea,
      select: [Select, 'options'],
      autocomplete: [Select, 'options'],
      checkbox: Checkbox,
      switch: Checkbox,
      multiselect: [Choices, (f, options) => ({ f, options, multiple: true, className: 'govuk-checkboxes--small' })],
      radio: [Choices, (f, options) => choices(options.length <= 2 ? 'govuk-radios--inline' : undefined)(f, options)],
      scale: [Choices, points],
      rating: [Choices, points],
    },
  }),
  file: FileField,
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
