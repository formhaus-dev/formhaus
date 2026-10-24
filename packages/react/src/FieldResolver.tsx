import type { FormField as FormFieldType } from '@formhaus/core';
import { builtInFields } from '@formhaus/core/internal';
import type { ComponentType } from 'react';
import { OptionsBusy } from './optionsBusy';
import type { FieldComponentMap, FieldComponentProps } from './types';

const noop = () => {};

export interface FieldResolverProps {
  id?: string;
  field: FormFieldType;
  value: unknown;
  error?: string;
  loading?: boolean;
  disabled?: boolean;
  components?: FieldComponentMap;
  onChange: (value: unknown) => void;
  onCommit?: (value: unknown) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  testId?: string;
  optionTestId?: (value: string) => string | undefined;
  matrix?: FieldComponentProps['matrix'];
  reveals?: FieldComponentProps['reveals'];
}

export function FieldResolver({ components, onBlur, busy = false, ...props }: FieldResolverProps & { busy?: boolean }) {
  const Component = components?.[props.field.type] as ComponentType<FieldComponentProps> | undefined;

  if (!Component) {
    let typeName = '';
    try {
      if (process.env.NODE_ENV !== 'production') typeName = `: ${props.field.type}`;
    } catch {}
    return <div className="fh-field--unsupported">Unsupported field type{typeName}</div>;
  }

  const builtIn = builtInFields.has(Component);
  return (
    <OptionsBusy.Provider value={builtIn && busy}>
      <Component {...props} loading={props.loading || (!builtIn && busy)} onBlur={onBlur ?? noop} />
    </OptionsBusy.Provider>
  );
}
