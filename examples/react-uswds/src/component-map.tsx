import type { FieldComponentMap, FieldProps } from '@formhaus/react';
import { type ControlOption, mapControls } from '@formhaus/react/controls';
import { ComboBox } from './fields/ComboBox';
import { counted } from './fields/CharacterCount';
import { Checkbox, Choices, FileInput, Input, Password, Select, Textarea } from './fields/controls';
import { DateTime, MemorableDate, parseTime, times } from './fields/DateFields';
import { MatrixRow } from './fields/MatrixRow';
import { Shell } from './fields/Shell';

const choices = (f: FieldProps, options: ControlOption[]) => ({ f, options });

export const components: FieldComponentMap = mapControls({
  shell: Shell,
  kinds: { date: 'group', datetime: 'group' },
  matrix: MatrixRow,
  conditionalReveal: ['radio', 'multiselect'],
  controls: {
    input: { component: Input, props: counted },
    password: { component: Password, props: counted },
    date: MemorableDate,
    datetime: DateTime,
    time: { component: ComboBox, props: () => ({ options: times, parse: parseTime, className: 'usa-time-picker' }) },
    textarea: { component: Textarea, props: counted },
    select: { component: Select, optionsProp: 'options' },
    autocomplete: { component: ComboBox, optionsProp: 'options' },
    checkbox: Checkbox,
    switch: Checkbox,
    multiselect: { component: Choices, props: (f, options) => ({ ...choices(f, options), multiple: true }) },
    radio: { component: Choices, props: choices },
    scale: { component: Choices, props: choices },
    rating: { component: Choices, props: (f, options) => ({ ...choices(f, options), stars: true }) },
    file: { component: FileInput, props: (f) => ({ file: f.value }) },
  },
});
