import type { FieldComponentMap } from '@formhaus/react';
import { CheckboxField } from './fields/CheckboxField';
import { MultiselectField } from './fields/MultiselectField';
import { RadioField } from './fields/RadioField';
import { SelectField } from './fields/SelectField';
import { TextareaField } from './fields/TextareaField';
import { TextField } from './fields/TextField';

export const components: FieldComponentMap = {
  text: TextField,
  email: TextField,
  phone: TextField,
  number: TextField,
  password: TextField,
  date: TextField,
  datetime: TextField,
  textarea: TextareaField,
  select: SelectField,
  multiselect: MultiselectField,
  radio: RadioField,
  checkbox: CheckboxField,
};
