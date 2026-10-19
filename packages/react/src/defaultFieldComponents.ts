import { fieldComponentsByName, mergeFieldComponents } from '@formhaus/core/internal';
import type { ComponentType } from 'react';
import { AutocompleteField } from './fields/AutocompleteField';
import { CheckboxField } from './fields/CheckboxField';
import { DateField } from './fields/DateField';
import { DateTimeField } from './fields/DateTimeField';
import { FileField } from './fields/FileField';
import { HiddenField } from './fields/HiddenField';
import { MultiselectField } from './fields/MultiselectField';
import { RadioField } from './fields/RadioField';
import { ScaleField } from './fields/ScaleField';
import { SelectField } from './fields/SelectField';
import { SwitchField } from './fields/SwitchField';
import { TextField } from './fields/TextField';
import { TextareaField } from './fields/TextareaField';
import { TimeField } from './fields/TimeField';
import type { FieldComponentMap, FieldComponentProps } from './types';

export const defaultFieldComponents = fieldComponentsByName<ComponentType<FieldComponentProps>>({
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
