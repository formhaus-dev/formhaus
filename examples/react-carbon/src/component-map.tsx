import type { FieldComponentMap, FieldProps } from '@formhaus/react';
import { type ControlOption, mapControls } from '@formhaus/react/controls';
import {
  Checkbox,
  ComboBox,
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
import { Choices, GroupShell } from './fields/Choices';
import { DateInput } from './fields/DateInput';
import { DateTimeField } from './fields/DateTimeField';
import { FileField } from './fields/FileField';
import { InlineShell } from './fields/InlineShell';
import { label, labels, texts } from './fields/labels';
import { MatrixRow } from './fields/MatrixRow';
import { Rating } from './fields/Rating';

const matches = ({ item, inputValue }: { item: ControlOption; inputValue: string | null }) =>
  !inputValue || item.label.toLowerCase().includes(inputValue.toLowerCase());

const group = (f: FieldProps, options: ControlOption[]) => ({
  legendText: label(f),
  helperText: f.helperText,
  error: f.error,
  describedBy: f.describedBy,
  options,
});

const counted = (f: FieldProps) => ({ ...labels(f), ...(f.maxLength && { enableCounter: true, maxCount: f.maxLength }) });

const checkbox = mapControls({
  shell: { input: null, inline: null, group: null },
  controls: {
    checkbox: {
      component: Checkbox,
      props: (f) => ({ ...labels(f), onChange: (_: unknown, { checked }: { checked: boolean }) => f.change(checked) }),
    },
  },
}).checkbox;

export const components: FieldComponentMap = {
  ...mapControls({
    shell: { input: null, inline: InlineShell, group: GroupShell },
    matrix: MatrixRow,
    freeText: true,
    kinds: { multiselect: 'input' },
    conditionalReveal: ['radio'],
    controls: {
      input: { component: TextInput, props: counted },
      password: { component: PasswordInput, props: labels },
      number: { component: NumberInput, props: (f) => ({ label: label(f), ...texts(f), allowEmpty: true }) },
      textarea: { component: TextArea, props: counted },
      date: { component: DateInput, props: labels },
      radio: { component: Choices, props: group },
      time: {
        component: TimePicker,
        props: (f) => ({
          labelText: label(f),
          invalid: f.invalid,
          invalidText: f.error,
          placeholder: 'hh:mm',
          pattern: '([01]\\d|2[0-3]):[0-5]\\d',
        }),
      },
      select: {
        component: Select,
        props: (f, options) => ({
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
      },
      autocomplete: {
        component: ComboBox<ControlOption>,
        props: (f, options) => ({
          ...texts(f),
          titleText: label(f),
          items: options,
          itemToString: (option: ControlOption | null) => option?.label ?? '',
          allowCustomValue: true,
          selectedItem: options.find((option) => option.value === f.value) ?? null,
          shouldFilterItem: matches,
          onChange: () => {},
        }),
        changeProp: 'onInputChange',
      },
      multiselect: {
        component: FilterableMultiSelect<ControlOption>,
        props: (f, options) => ({
          ...texts(f),
          titleText: label(f),
          items: options,
          itemToString: (option: ControlOption | null) => option?.label ?? '',
          selectedItems: options.filter((option) => [f.value].flat().includes(option.value)),
          onChange: ({ selectedItems }: { selectedItems: ControlOption[] | null }) =>
            f.change((selectedItems ?? []).map((option) => option.value)),
        }),
      },
      switch: { component: Toggle, props: (f) => ({ labelText: label(f), toggled: f.value === true }), changeProp: 'onToggle' },
      scale: {
        component: Choices,
        props: (f, options) => ({
          ...group(f, options),
          orientation: 'horizontal',
          helperText: [f.helperText, f.options.map((option) => `${option.value}: ${option.label}`).join(', ')].filter(Boolean).join('. '),
        }),
      },
      rating: { component: Rating, props: group },
    },
  }),
  checkbox,
  datetime: DateTimeField,
  file: FileField,
};
