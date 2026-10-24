import type { FieldComponentMap, FieldProps } from '@formhaus/react';
import { type ControlOption, mapControls } from '@formhaus/react/controls';
import { ComboBox } from './fields/ComboBox';
import { Checkbox, Choices, Input, Password, Select, Textarea } from './fields/controls';
import { DateTime, MemorableDate, parseTime, times } from './fields/DateFields';
import { FileField } from './fields/FileField';
import { MatrixRow } from './fields/MatrixRow';
import { Shell } from './fields/Shell';

const choices = (f: FieldProps, options: ControlOption[]) => ({ f, options });

export const components: FieldComponentMap = {
  ...mapControls({
    shell: Shell,
    kinds: { date: 'group', datetime: 'group' },
    matrix: MatrixRow,
    controls: {
      input: Input,
      password: Password,
      date: MemorableDate,
      datetime: DateTime,
      time: [ComboBox, () => ({ options: times, parse: parseTime, className: 'usa-time-picker' })],
      textarea: Textarea,
      select: [Select, 'options'],
      autocomplete: [ComboBox, 'options'],
      checkbox: Checkbox,
      switch: Checkbox,
      multiselect: [Choices, (f, options) => ({ ...choices(f, options), multiple: true })],
      radio: [Choices, choices],
      scale: [Choices, choices],
      rating: [Choices, (f, options) => ({ ...choices(f, options), stars: true })],
    },
  }),
  file: FileField,
};
