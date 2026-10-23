import type { FieldComponentMap } from '@formhaus/vue';
import AutocompleteField from './fields/AutocompleteField.vue';
import CheckboxField from './fields/CheckboxField.vue';
import DateField from './fields/DateField.vue';
import FileField from './fields/FileField.vue';
import HiddenField from './fields/HiddenField.vue';
import MultiselectField from './fields/MultiselectField.vue';
import NumberField from './fields/NumberField.vue';
import PasswordField from './fields/PasswordField.vue';
import RadioField from './fields/RadioField.vue';
import RatingField from './fields/RatingField.vue';
import ScaleField from './fields/ScaleField.vue';
import SelectField from './fields/SelectField.vue';
import TextareaField from './fields/TextareaField.vue';
import TextField from './fields/TextField.vue';

export const components: FieldComponentMap = {
  text: TextField,
  email: TextField,
  phone: TextField,
  password: PasswordField,
  number: NumberField,
  textarea: TextareaField,
  select: SelectField,
  multiselect: MultiselectField,
  autocomplete: AutocompleteField,
  radio: RadioField,
  checkbox: CheckboxField,
  switch: CheckboxField,
  date: DateField,
  datetime: DateField,
  time: DateField,
  file: FileField,
  scale: ScaleField,
  rating: RatingField,
  hidden: HiddenField,
};
