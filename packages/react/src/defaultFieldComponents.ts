import type { DefaultFieldType } from '@formhaus/core';
import type { ComponentType } from 'react';
import { AutocompleteField } from './fields/AutocompleteField';
import { CheckboxField } from './fields/CheckboxField';
import { DateField } from './fields/DateField';
import { DateTimeField } from './fields/DateTimeField';
import { FileField } from './fields/FileField';
import { MultiselectField } from './fields/MultiselectField';
import { RadioField } from './fields/RadioField';
import { SelectField } from './fields/SelectField';
import { SwitchField } from './fields/SwitchField';
import { TextField } from './fields/TextField';
import { TextareaField } from './fields/TextareaField';
import type { FieldComponentMap, FieldComponentProps } from './types';

const defaultFieldComponents: Record<DefaultFieldType, ComponentType<FieldComponentProps>> = {
  text: TextField,
  email: TextField,
  phone: TextField,
  number: TextField,
  password: TextField,
  select: SelectField,
  autocomplete: AutocompleteField,
  multiselect: MultiselectField,
  checkbox: CheckboxField,
  radio: RadioField,
  switch: SwitchField,
  file: FileField,
  date: DateField,
  datetime: DateTimeField,
  textarea: TextareaField,
};

export function withDefaultFields(components?: FieldComponentMap): FieldComponentMap {
  const merged: FieldComponentMap = { ...defaultFieldComponents };
  for (const [type, component] of Object.entries(components ?? {})) {
    if (component) merged[type] = component;
  }
  return merged;
}
