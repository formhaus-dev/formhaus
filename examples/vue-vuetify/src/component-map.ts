import type { FieldComponentMap } from '@formhaus/vue';
import AutocompleteField from './fields/AutocompleteField.vue';
import CheckboxField from './fields/CheckboxField.vue';
import FileField from './fields/FileField.vue';
import HiddenField from './fields/HiddenField.vue';
import RadioField from './fields/RadioField.vue';
import RatingField from './fields/RatingField.vue';
import ScaleField from './fields/ScaleField.vue';
import SelectField from './fields/SelectField.vue';
import SwitchField from './fields/SwitchField.vue';
import TextField from './fields/TextField.vue';
import TextareaField from './fields/TextareaField.vue';

export const components: FieldComponentMap = {
  text: TextField,
  email: TextField,
  phone: TextField,
  number: TextField,
  password: TextField,
  date: TextField,
  datetime: TextField,
  time: TextField,
  select: SelectField,
  autocomplete: AutocompleteField,
  multiselect: SelectField,
  checkbox: CheckboxField,
  radio: RadioField,
  rating: RatingField,
  scale: ScaleField,
  switch: SwitchField,
  file: FileField,
  textarea: TextareaField,
  hidden: HiddenField,
};
