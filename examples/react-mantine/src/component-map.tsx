import type { FieldComponentMap, FieldProps } from '@formhaus/react';
import { type ControlOption, mapControls } from '@formhaus/react/controls';
import {
  Autocomplete,
  Checkbox,
  FileInput,
  Group,
  Image,
  MultiSelect,
  NumberInput,
  PasswordInput,
  Radio,
  Rating,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { DatePickerInput, DateTimePicker, TimePicker } from '@mantine/dates';
import { GroupShell } from './fields/GroupShell';
import { labels } from './fields/labels';
import { MatrixRow } from './fields/MatrixRow';

const items = (options: ControlOption[]) => options.map(({ value, label }) => ({ value: String(value), label }));
const closed = { comboboxProps: { keepMounted: false } };

const clock = (f: FieldProps) => ({
  id: undefined,
  labelProps: { htmlFor: f.id },
  descriptionProps: { id: f.helperId },
  errorProps: { id: f.errorId },
  hoursInputProps: { id: f.id, ...f.aria },
  onChange: (next: string) => f.change(next.slice(0, 5)),
});

const radios = (options: ControlOption[]) =>
  options.some((option) => option.image) ? (
    <SimpleGrid cols={{ base: 1, xs: Math.min(options.length, 3) }}>
      {options.map((option) => (
        <Radio.Card key={option.value} value={String(option.value)} p="sm" radius="md">
          <Stack gap="xs">
            {option.image && <Image src={option.image} alt="" radius="sm" h={96} fit="cover" />}
            <Group gap="xs" wrap="nowrap">
              <Radio.Indicator />
              <Text size="sm">{option.label}</Text>
            </Group>
          </Stack>
        </Radio.Card>
      ))}
    </SimpleGrid>
  ) : (
    <Stack gap="xs">
      {options.map((option) => (
        <Radio key={option.value} value={String(option.value)} label={option.label} />
      ))}
    </Stack>
  );

export const components: FieldComponentMap = {
  ...mapControls({
    shell: { input: null, inline: null, group: GroupShell },
    labels,
    freeText: true,
    kinds: { multiselect: 'input' },
    matrix: MatrixRow,
    controls: {
      input: TextInput,
      password: PasswordInput,
      number: NumberInput,
      textarea: Textarea,
      select: [Select, (_, options) => ({ data: items(options), allowDeselect: false, ...closed })],
      autocomplete: [Autocomplete, (_, options) => ({ data: options.map((option) => option.label), ...closed })],
      multiselect: [MultiSelect, (_, options) => ({ data: items(options), searchable: true, ...closed })],
      date: [DatePickerInput, (f) => ({ value: f.text || null, valueFormat: 'MMM D, YYYY', clearable: true })],
      datetime: [
        DateTimePicker,
        (f) => ({
          value: f.text.replace('T', ' ') || null,
          valueFormat: 'MMM D, YYYY HH:mm',
          clearable: true,
          onChange: (next: unknown) => f.change(typeof next === 'string' ? next.slice(0, 16).replace(' ', 'T') : null),
        }),
      ],
      time: [TimePicker, clock],
      checkbox: Checkbox,
      switch: Switch,
      radio: [Radio.Group, (_, options) => ({ children: radios(options) })],
      scale: [
        SegmentedControl,
        (f, options) => ({ data: items(options), value: f.text, fullWidth: true, color: 'blue', withItemsBorders: false }),
      ],
      rating: [Rating, (f, options) => ({ count: options.length, size: 'lg', readOnly: f.disabled })],
      file: [
        FileInput,
        (f) => ({ clearable: true, placeholder: f.placeholder ?? 'Choose a file', value: f.value instanceof File ? f.value : null }),
      ],
    },
  }),
};
