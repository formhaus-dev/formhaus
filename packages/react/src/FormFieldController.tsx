import type { FieldOption, FormEngine, FormField as FormFieldType } from '@formhaus/core';
import { memo, useCallback, useSyncExternalStore } from 'react';
import { FormField } from './FormField';
import type { FieldComponentMap } from './types';

interface FormFieldControllerProps {
  engine: FormEngine;
  field: FormFieldType;
  options?: FieldOption[];
  disabled?: boolean;
  components?: FieldComponentMap;
  onChange: (key: string, value: unknown) => void;
  onBlur: (key: string) => void;
  onFocus: (key: string) => void;
}

export const FormFieldController = memo(function FormFieldController({
  engine,
  field,
  options,
  disabled,
  components,
  onChange,
  onBlur,
  onFocus,
}: FormFieldControllerProps) {
  const subscribe = useCallback(
    (listener: () => void) => engine.subscribeField(field.key, listener),
    [engine, field.key],
  );
  const getSnapshot = useCallback(
    () => engine.getFieldSnapshot(field.key),
    [engine, field.key],
  );

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const handleChange = useCallback(
    (value: unknown) => onChange(field.key, value),
    [field.key, onChange],
  );
  const handleBlur = useCallback(() => onBlur(field.key), [field.key, onBlur]);
  const handleFocus = useCallback(() => onFocus(field.key), [field.key, onFocus]);
  const fieldWithOptions = options ? { ...field, options } : field;

  return (
    <FormField
      field={fieldWithOptions}
      value={engine.values[field.key]}
      error={engine.errors[field.key]}
      loading={engine.fieldLoading[field.key]}
      disabled={disabled}
      components={components}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );
});
