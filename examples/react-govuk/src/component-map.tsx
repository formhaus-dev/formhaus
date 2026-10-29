import type { FieldComponentMap, FieldProps, LayoutComponentMap } from '@formhaus/react';
import { type ControlOption, type ControlSpec, mapControls } from '@formhaus/react/controls';
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
const dateParts: ControlSpec<typeof DateInput> = {
  component: DateInput,
  props: (f) => ({ type: f.inputType, autoComplete: f.input.autoComplete }),
};

export const components: FieldComponentMap = mapControls({
  shell: Shell,
  kinds: { date: 'group', time: 'group', datetime: 'group' },
  conditionalReveal: ['radio', 'multiselect'],
  matrix: mapControls({ shell: Shell, controls: { radio: { component: Choices, props: stacked } } }).radio,
  controls: {
    input: Input,
    password: Password,
    date: dateParts,
    time: dateParts,
    datetime: dateParts,
    textarea: Textarea,
    select: { component: Select, optionsProp: 'options' },
    autocomplete: { component: Select, optionsProp: 'options' },
    checkbox: Checkbox,
    switch: Checkbox,
    multiselect: { component: Choices, props: (f, options) => ({ f, options, multiple: true }) },
    radio: { component: Choices, props: (f, options) => ({ f, options, inline: shortPair(options) }) },
    scale: { component: Choices, props: stacked },
    rating: { component: Choices, props: stacked },
    file: { component: FileUpload, props: (f) => ({ f }) },
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
