import type { DefaultFieldType } from '../types';

const DEFAULT_FIELD_COMPONENT_NAMES = {
  text: 'TextField',
  email: 'TextField',
  phone: 'TextField',
  number: 'TextField',
  password: 'TextField',
  select: 'SelectField',
  autocomplete: 'AutocompleteField',
  multiselect: 'MultiselectField',
  checkbox: 'CheckboxField',
  radio: 'RadioField',
  switch: 'SwitchField',
  file: 'FileField',
  date: 'DateField',
  datetime: 'DateTimeField',
  time: 'TimeField',
  textarea: 'TextareaField',
  hidden: 'HiddenField',
  scale: 'ScaleField',
  rating: 'ScaleField',
} as const satisfies Record<DefaultFieldType, string>;

type DefaultFieldComponentName = (typeof DEFAULT_FIELD_COMPONENT_NAMES)[DefaultFieldType];

export function fieldComponentsByName<T>(byName: Record<DefaultFieldComponentName, T>): Record<DefaultFieldType, T> {
  return Object.fromEntries(Object.entries(DEFAULT_FIELD_COMPONENT_NAMES).map(([type, name]) => [type, byName[name]])) as Record<
    DefaultFieldType,
    T
  >;
}

export function mergeFieldComponents<M extends object>(defaults: Partial<M>, components?: M): M {
  const merged = { ...defaults } as Record<string, unknown>;
  for (const [type, component] of Object.entries(components ?? {})) {
    if (component) merged[type] = component;
  }
  return merged as M;
}
