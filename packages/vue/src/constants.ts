import type { DefaultFieldType } from '@formhaus/core';
import type { Component } from 'vue';
import CheckboxField from './fields/CheckboxField.vue';
import DateField from './fields/DateField.vue';
import FileField from './fields/FileField.vue';
import MultiselectField from './fields/MultiselectField.vue';
import RadioField from './fields/RadioField.vue';
import SelectField from './fields/SelectField.vue';
import SwitchField from './fields/SwitchField.vue';
import TextField from './fields/TextField.vue';
import TextareaField from './fields/TextareaField.vue';

export const defaultFieldComponents: Record<DefaultFieldType, Component> = {
  text: TextField,
  email: TextField,
  phone: TextField,
  number: TextField,
  password: TextField,
  select: SelectField,
  multiselect: MultiselectField,
  checkbox: CheckboxField,
  radio: RadioField,
  switch: SwitchField,
  file: FileField,
  date: DateField,
  textarea: TextareaField,
};
