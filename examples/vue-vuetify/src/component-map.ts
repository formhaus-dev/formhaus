import type { FieldComponentMap } from '@formhaus/vue';
import CheckboxField from './fields/CheckboxField.vue';
import FileField from './fields/FileField.vue';
import RadioField from './fields/RadioField.vue';
import SelectField from './fields/SelectField.vue';
import SwitchField from './fields/SwitchField.vue';
import TextField from './fields/TextField.vue';
import TextareaField from './fields/TextareaField.vue';

export const components: Partial<FieldComponentMap> = {
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
