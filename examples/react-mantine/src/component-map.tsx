import type { FieldComponentMap, FieldProps } from '@formhaus/react';
import { type ControlOption, mapControls } from '@formhaus/react/controls';
import {
  Autocomplete,
  Checkbox,
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
import { Fragment } from 'react';
import { FileField } from './fields/FileField';
import { GroupShell, RadioList } from './fields/GroupShell';
import { labels, marked, spoken } from './fields/labels';
import { MatrixRow } from './fields/MatrixRow';

const items = (options: ControlOption[]) => options.map(({ value, label }) => ({ value: String(value), label }));
const closed = { comboboxProps: { keepMounted: false } };

const clock = (f: FieldProps) => ({
  id: undefined,
  labelProps: { htmlFor: f.id },
  descriptionProps: { id: f.helperId },
  errorProps: { id: f.errorId },
  hoursInputProps: { id: f.id, ...f.aria },
  minutesInputLabel: `${f.label} minutes`,
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
    <RadioList>
      {options.map((option) => (
        <Fragment key={option.value}>
          <Radio value={String(option.value)} label={option.label} aria-controls={option.reveal?.id} />
          {option.reveal && (
            <Stack
              id={option.reveal.id}
              data-fh="reveal"
              hidden={!option.reveal.open}
              display={option.reveal.open ? undefined : 'none'}
              gap="lg"
              ms="xs"
              ps="lg"
              style={{ borderInlineStart: '2px solid var(--mantine-color-default-border)' }}
            >
              {option.reveal.children}
            </Stack>
          )}
        </Fragment>
      ))}
    </RadioList>
  );

export const components: FieldComponentMap = {
  ...mapControls({
    shell: { input: null, inline: null, group: GroupShell },
    labels,
    freeText: true,
    kinds: { multiselect: 'input' },
    matrix: MatrixRow,
    conditionalReveal: ['radio'],
    controls: {
      input: TextInput,
      password: PasswordInput,
      number: NumberInput,
      textarea: Textarea,
      select: { component: Select, props: (_, options) => ({ data: items(options), allowDeselect: false, ...closed }) },
      autocomplete: { component: Autocomplete, props: (_, options) => ({ data: options.map((option) => option.label), ...closed }) },
      multiselect: { component: MultiSelect, props: (_, options) => ({ data: items(options), searchable: true, ...closed }) },
      date: {
        component: DatePickerInput,
        props: (f) => ({ ...spoken(f), 'aria-required': undefined, value: f.text || null, valueFormat: 'MMM D, YYYY', clearable: true }),
      },
      datetime: {
        component: DateTimePicker,
        props: (f) => ({
          value: f.text.replace('T', ' ') || null,
          valueFormat: 'MMM D, YYYY HH:mm',
          clearable: true,
          onChange: (next: unknown) => f.change(typeof next === 'string' ? next.slice(0, 16).replace(' ', 'T') : null),
        }),
      },
      time: { component: TimePicker, props: clock },
      checkbox: { component: Checkbox, props: marked },
      switch: { component: Switch, props: marked },
      radio: { component: Radio.Group, props: (_, options) => ({ 'aria-required': undefined, children: radios(options) }) },
      scale: {
        component: SegmentedControl,
        props: (f, options) => ({ data: items(options), value: f.text, fullWidth: true, color: 'blue', withItemsBorders: false }),
      },
      rating: {
        component: Rating,
        props: (f, options) => ({ 'aria-required': undefined, count: options.length, size: 'lg', readOnly: f.disabled }),
      },
      file: {
        component: FileField,
        props: (f, _, { field }) => ({
          f,
          field,
          clearable: true,
          placeholder: f.placeholder ?? 'Choose a file',
          value: f.value instanceof File ? f.value : null,
        }),
      },
    },
  }),
};
