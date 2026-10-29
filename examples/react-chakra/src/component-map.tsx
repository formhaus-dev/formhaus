import type { FieldComponentMap, FieldProps } from '@formhaus/react';
import { mapControls } from '@formhaus/react/controls';
import { Checkbox, Field, NumberInput, RatingGroup, SegmentGroup, Select, Switch } from '@chakra-ui/react';
import { Autocomplete } from './fields/Autocomplete';
import { Choices, optionIds } from './fields/Choices';
import { CountedInput, CountedTextarea } from './fields/Counted';
import { FileField } from './fields/FileField';
import { MatrixRow } from './fields/MatrixRow';
import { select } from './fields/select';
import { labelId, Shell } from './fields/Shell';

const toggle = (Part: typeof Checkbox | typeof Switch) => (f: FieldProps) => ({
  'aria-required': undefined,
  children: (
    <>
      <Part.HiddenInput aria-describedby={f.describedBy} aria-required={f.required || undefined} />
      <Part.Control />
      <Part.Label>
        {f.label}
        <Field.RequiredIndicator ms="1" />
      </Part.Label>
    </>
  ),
});

const upload = (f: FieldProps) => ({
  f,
  'aria-describedby': undefined,
  'aria-invalid': undefined,
  'aria-required': undefined,
  ids: { hiddenInput: `${f.id}-input` },
});

export const components: FieldComponentMap = {
  ...mapControls({
    shell: Shell,
    matrix: MatrixRow,
    freeText: true,
    kinds: { multiselect: 'input' },
    conditionalReveal: ['radio'],
    controls: {
      input: { component: CountedInput, props: (f) => ({ f }) },
      textarea: { component: CountedTextarea, props: (f) => ({ f, autoresize: true }) },
      number: {
        component: NumberInput.Root,
        props: (f) => ({
          width: 'full',
          children: (
            <>
              <NumberInput.Control />
              <NumberInput.Input placeholder={f.placeholder} aria-describedby={f.describedBy} />
            </>
          ),
        }),
        changeProp: 'onValueChange',
      },
      select: { component: Select.Root, props: select(false) },
      multiselect: { component: Select.Root, props: select(true) },
      autocomplete: { component: Autocomplete, optionsProp: 'options' },
      checkbox: { component: Checkbox.Root, props: toggle(Checkbox) },
      switch: { component: Switch.Root, props: toggle(Switch) },
      radio: { component: Choices, optionsProp: 'options', changeProp: 'onValueChange' },
      scale: {
        component: SegmentGroup.Root,
        props: (f, options) => ({
          width: 'full',
          value: f.text || null,
          ids: optionIds(f.id, options),
          children: (
            <>
              <SegmentGroup.Indicator />
              <SegmentGroup.Items items={options.map((option) => String(option.value))} flex="1" justifyContent="center" px="0" />
            </>
          ),
        }),
      },
      rating: {
        component: RatingGroup.Root,
        props: (f, options) => ({
          count: options.length,
          value: Number(f.text),
          size: 'lg',
          colorPalette: 'orange',
          'aria-required': undefined,
          ids: { label: labelId(f), item: (index: string) => (index === '1' ? f.id : `${f.id}-${index}`) },
          children: (
            <>
              <RatingGroup.HiddenInput />
              <RatingGroup.Control aria-required={f.required || undefined} />
            </>
          ),
        }),
        changeProp: 'onValueChange',
      },
      file: { component: FileField, props: upload },
    },
  }),
};
