import type { FieldComponentMap, FieldProps } from '@formhaus/react';
import { type ControlOption, mapControls } from '@formhaus/react/controls';
import {
  Checkbox,
  FilterableMultiSelect,
  NumberInput,
  PasswordInput,
  Select,
  SelectItem,
  TextArea,
  TextInput,
  TimePicker,
  Toggle,
} from '@carbon/react';
import { AutocompleteField } from './fields/AutocompleteField';
import { Choices } from './fields/Choices';
import { DateInput } from './fields/DateInput';
import { DateTimeField } from './fields/DateTimeField';
import { FileField } from './fields/FileField';
import { InlineShell } from './fields/InlineShell';
import { label, labels, texts } from './fields/labels';
import { MatrixRow } from './fields/MatrixRow';
import { Rating } from './fields/Rating';

const group = (f: FieldProps, options: ControlOption[]) => ({
  legendText: label(f),
  helperText: f.helperText,
  error: f.error,
  describedBy: f.describedBy,
  options,
});

export const components: FieldComponentMap = {
  ...mapControls({
    shell: { input: null, inline: InlineShell, group: null },
    kinds: { multiselect: 'input' },
    matrix: MatrixRow,
    controls: {
      input: [TextInput, labels],
      password: [PasswordInput, labels],
      number: [NumberInput, (f) => ({ label: label(f), ...texts(f), allowEmpty: true })],
      textarea: [TextArea, (f) => ({ ...labels(f), rows: 3 })],
      date: [DateInput, labels],
      time: [
        TimePicker,
        (f) => ({
          labelText: label(f),
          invalid: f.invalid,
          invalidText: f.error,
          placeholder: 'hh:mm',
          pattern: '([01]\\d|2[0-3]):[0-5]\\d',
        }),
      ],
      select: [
        Select,
        (f, options) => ({
          ...labels(f),
          children: (
            <>
              <SelectItem value="" text={f.placeholder ?? 'Choose an option'} disabled hidden />
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value} text={option.label} />
              ))}
            </>
          ),
        }),
      ],
      multiselect: [
        FilterableMultiSelect<ControlOption>,
        (f, options) => ({
          ...texts(f),
          titleText: label(f),
          items: options,
          itemToString: (option: ControlOption | null) => option?.label ?? '',
          selectedItems: options.filter((option) => [f.value].flat().includes(option.value)),
          onChange: ({ selectedItems }: { selectedItems: ControlOption[] | null }) =>
            f.change((selectedItems ?? []).map((option) => option.value)),
        }),
      ],
      checkbox: [
        Checkbox,
        (f) => ({ labelText: label(f), onChange: (_: unknown, { checked }: { checked: boolean }) => f.change(checked) }),
      ],
      switch: [Toggle, (f) => ({ labelText: label(f), toggled: f.value === true }), 'onToggle'],
      radio: [Choices, (f, options) => ({ ...group(f, options), orientation: 'vertical' })],
      scale: [
        Choices,
        (f, options) => ({
          ...group(f, options),
          helperText: [f.helperText, f.options.map((option) => `${option.value}: ${option.label}`).join(', ')].filter(Boolean).join('. '),
        }),
      ],
      rating: [Rating, group],
    },
  }),
  autocomplete: AutocompleteField,
  datetime: DateTimeField,
  file: FileField,
};
