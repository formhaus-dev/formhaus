import type { FieldComponentMap } from '@formhaus/react';
import { AutocompleteField } from './fields/AutocompleteField';
import { CheckboxField } from './fields/CheckboxField';
import { DateField } from './fields/DateField';
import { DateTimeField } from './fields/DateTimeField';
import { FileField } from './fields/FileField';
import { HiddenField } from './fields/HiddenField';
import { NumberField } from './fields/NumberField';
import { RadioField } from './fields/RadioField';
import { RatingField } from './fields/RatingField';
import { ScaleField } from './fields/ScaleField';
import { SelectField } from './fields/SelectField';
import { TextField } from './fields/TextField';
import { TextareaField } from './fields/TextareaField';

export const components: FieldComponentMap = {
  text: TextField,
  email: TextField,
  phone: TextField,
  password: TextField,
  number: NumberField,
  textarea: TextareaField,
  select: SelectField,
  multiselect: SelectField,
  autocomplete: AutocompleteField,
  radio: RadioField,
  checkbox: CheckboxField,
  switch: CheckboxField,
  date: DateField,
  datetime: DateTimeField,
  time: TextField,
  file: FileField,
  scale: ScaleField,
  rating: RatingField,
  hidden: HiddenField,
};
