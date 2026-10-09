import type { FieldComponentMap } from '@formhaus/react';
import { CheckboxField } from './fields/CheckboxField';
import { RadioField } from './fields/RadioField';
import { SelectField } from './fields/SelectField';
import { TextField } from './fields/TextField';

export const components: FieldComponentMap = {
  text: TextField,
  email: TextField,
  phone: TextField,
  number: TextField,
  password: TextField,
  date: TextField,
  datetime: TextField,
  select: SelectField,
  radio: RadioField,
  checkbox: CheckboxField,
};
