import type { FieldComponentMap, FieldComponentProps, FieldProps } from '@formhaus/react';
import { mapControls } from '@formhaus/react/controls';
import {
  Button,
  Checkbox,
  Field,
  FileUpload,
  HStack,
  Input,
  NumberInput,
  RatingGroup,
  SegmentGroup,
  Select,
  Switch,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { Autocomplete } from './fields/Autocomplete';
import { Choices, optionIds } from './fields/Choices';
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
  'aria-describedby': undefined,
  'aria-invalid': undefined,
  'aria-required': undefined,
  maxFiles: 1,
  ids: { hiddenInput: `${f.id}-input` },
  children: (
    <>
      <FileUpload.HiddenInput />
      <HStack gap="3">
        <FileUpload.Trigger asChild>
          <Button id={f.id} variant="outline" size="sm" aria-describedby={f.describedBy}>
            {f.placeholder ?? 'Choose a file'}
          </Button>
        </FileUpload.Trigger>
        <Text textStyle="sm" color="fg.muted">
          {f.value instanceof File ? f.value.name : 'No file chosen'}
        </Text>
      </HStack>
    </>
  ),
});

const base = { shell: Shell, matrix: MatrixRow };

const radio = (inline: boolean) => mapControls({ ...base, controls: { radio: [Choices, (_, options) => ({ options, inline })] } }).radio;

const InlineRadio = radio(true);
const StackedRadio = radio(false);

export const components: FieldComponentMap = {
  ...mapControls({
    ...base,
    freeText: true,
    kinds: { multiselect: 'input' },
    controls: {
      input: Input,
      textarea: [Textarea, () => ({ autoresize: true })],
      number: [
        NumberInput.Root,
        (f) => ({
          width: 'full',
          children: (
            <>
              <NumberInput.Control />
              <NumberInput.Input placeholder={f.placeholder} aria-describedby={f.describedBy} />
            </>
          ),
        }),
        'onValueChange',
      ],
      select: [Select.Root, select(false)],
      multiselect: [Select.Root, select(true)],
      autocomplete: [Autocomplete, 'options'],
      checkbox: [Checkbox.Root, toggle(Checkbox)],
      switch: [Switch.Root, toggle(Switch)],
      scale: [
        SegmentGroup.Root,
        (f, options) => ({
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
      ],
      rating: [
        RatingGroup.Root,
        (f, options) => ({
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
        'onValueChange',
      ],
      file: [FileUpload.Root, upload],
    },
  }),
  radio: (props: FieldComponentProps) => (props.field.layout === 'inline' ? <InlineRadio {...props} /> : <StackedRadio {...props} />),
};
