import type { FieldComponentMap } from '@formhaus/react';
import { CheckboxField } from './fields/CheckboxField';
import { HiddenField } from './fields/HiddenField';
import { MultiselectField } from './fields/MultiselectField';
import { RadioField } from './fields/RadioField';
import { ScaleField } from './fields/ScaleField';
import { SelectField } from './fields/SelectField';
import { SwitchField } from './fields/SwitchField';
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
  time: TextField,
  textarea: TextareaField,
  select: SelectField,
  multiselect: MultiselectField,
  radio: RadioField,
  checkbox: CheckboxField,
  switch: SwitchField,
  scale: ScaleField,
  rating: ScaleField,
  hidden: HiddenField,
};
