import type { FieldComponentMap } from '@formhaus/react';
import { CheckboxField } from './fields/CheckboxField';
import { FileField } from './fields/FileField';
import { RadioField } from './fields/RadioField';
import { SelectField } from './fields/SelectField';
import { SwitchField } from './fields/SwitchField';
import { TextField } from './fields/TextField';
import { TextareaField } from './fields/TextareaField';

export const components: FieldComponentMap = {
  text: TextField,
  email: TextField,
  phone: TextField,
  number: TextField,
  password: TextField,
  date: TextField,
  select: SelectField,
  multiselect: SelectField,
  checkbox: CheckboxField,
  radio: RadioField,
  switch: SwitchField,
  file: FileField,
  textarea: TextareaField,
};
