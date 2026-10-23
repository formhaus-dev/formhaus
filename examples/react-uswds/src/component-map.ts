import type { FieldComponentMap } from '@formhaus/react';
import { AutocompleteField } from './fields/AutocompleteField';
import { CheckboxField } from './fields/CheckboxField';
import { DateField } from './fields/DateFields';
import { FileField } from './fields/FileField';
import { HiddenField } from './fields/HiddenField';
import { InputField } from './fields/InputField';
import { RadioField } from './fields/RadioField';
import { SelectField } from './fields/SelectField';
import { TextareaField } from './fields/TextareaField';

export const components: FieldComponentMap = {
  text: InputField,
  email: InputField,
  phone: InputField,
  number: InputField,
  password: InputField,
  textarea: TextareaField,
  select: SelectField,
  multiselect: CheckboxField,
  autocomplete: AutocompleteField,
  radio: RadioField,
  checkbox: CheckboxField,
  switch: CheckboxField,
  date: DateField,
  datetime: DateField,
  time: DateField,
  file: FileField,
  scale: RadioField,
  rating: RadioField,
  hidden: HiddenField,
};
