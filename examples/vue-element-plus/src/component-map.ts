import type { FieldComponentMap } from '@formhaus/vue';
import AutocompleteField from './fields/AutocompleteField.vue';
import CheckboxField from './fields/CheckboxField.vue';
import DateField from './fields/DateField.vue';
import FileField from './fields/FileField.vue';
import HiddenField from './fields/HiddenField.vue';
import NumberField from './fields/NumberField.vue';
import RadioField from './fields/RadioField.vue';
import RatingField from './fields/RatingField.vue';
import ScaleField from './fields/ScaleField.vue';
import SelectField from './fields/SelectField.vue';
import SwitchField from './fields/SwitchField.vue';
import TextField from './fields/TextField.vue';

export const components: FieldComponentMap = {
  text: TextField,
  email: TextField,
  phone: TextField,
  password: TextField,
  textarea: TextField,
  number: NumberField,
  select: SelectField,
  multiselect: SelectField,
  autocomplete: AutocompleteField,
  radio: RadioField,
  checkbox: CheckboxField,
  switch: SwitchField,
  date: DateField,
  datetime: DateField,
  time: DateField,
  file: FileField,
  scale: ScaleField,
  rating: RatingField,
  hidden: HiddenField,
};
