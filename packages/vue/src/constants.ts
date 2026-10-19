import { fieldComponentsByName, mergeFieldComponents } from '@formhaus/core/internal';
import type { Component } from 'vue';
import AutocompleteField from './fields/AutocompleteField.vue';
import CheckboxField from './fields/CheckboxField.vue';
import DateField from './fields/DateField.vue';
import DateTimeField from './fields/DateTimeField.vue';
import FileField from './fields/FileField.vue';
import HiddenField from './fields/HiddenField.vue';
import MultiselectField from './fields/MultiselectField.vue';
import RadioField from './fields/RadioField.vue';
import ScaleField from './fields/ScaleField.vue';
import SelectField from './fields/SelectField.vue';
import SwitchField from './fields/SwitchField.vue';
import TextField from './fields/TextField.vue';
import TextareaField from './fields/TextareaField.vue';
import TimeField from './fields/TimeField.vue';
import type { FieldComponentMap } from './types';

export const defaultFieldComponents = fieldComponentsByName<Component>({
  AutocompleteField,
  CheckboxField,
  DateField,
  DateTimeField,
  FileField,
  HiddenField,
  MultiselectField,
  RadioField,
  ScaleField,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
  TimeField,
});

export const withDefaultFields = (components?: FieldComponentMap): FieldComponentMap =>
  mergeFieldComponents(defaultFieldComponents, components);
