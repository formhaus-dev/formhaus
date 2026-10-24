import type { FieldComponentMap, FieldProps, LayoutComponentMap } from '@formhaus/react';
import { type ControlOption, mapControls } from '@formhaus/react/controls';
import { Choices } from './fields/Choices';
import { Checkbox, FileUpload, Input, Password, Select, Textarea } from './fields/controls';
import { DateInput } from './fields/DateInput';
import { Shell } from './fields/Shell';
import { Fields, Group, GroupItem, Section } from './layout/Containers';
import { ErrorSummary, FormErrors } from './layout/ErrorSummary';
import { FormActions } from './layout/FormActions';
import { StepProgress } from './layout/StepProgress';

const stacked = (f: FieldProps, options: ControlOption[]) => ({ f, options });
const shortPair = (options: ControlOption[]) => options.length === 2 && options.every((option) => option.label.length <= 12);
const dateParts = [DateInput, (f: FieldProps) => ({ type: f.inputType, autoComplete: f.input.autoComplete })] as const;

export const components: FieldComponentMap = mapControls({
  shell: Shell,
  kinds: { date: 'group', time: 'group', datetime: 'group' },
  matrix: mapControls({ shell: Shell, controls: { radio: [Choices, stacked] } }).radio,
  controls: {
    input: Input,
    password: Password,
    date: dateParts,
    time: dateParts,
    datetime: dateParts,
    textarea: Textarea,
    select: [Select, 'options'],
    autocomplete: [Select, 'options'],
    checkbox: Checkbox,
    switch: Checkbox,
    multiselect: [Choices, (f, options) => ({ f, options, multiple: true })],
    radio: [Choices, (f, options) => ({ f, options, inline: shortPair(options) })],
    scale: [Choices, stacked],
    rating: [Choices, stacked],
    file: FileUpload,
  },
});

export const layout: LayoutComponentMap = {
  fields: Fields,
  actions: FormActions,
  progress: StepProgress,
  errorSummary: ErrorSummary,
  formErrors: FormErrors,
  section: Section,
  group: Group,
  groupItem: GroupItem,
};
