import { errorDomId, fieldDomId, recalled, recalls } from '@formhaus/core/internal';
import type { FieldOption, FormEngine, FormField as FormFieldType } from '@formhaus/core';
import { memo, useCallback } from 'react';
import { useFieldSnapshot, useRecallSnapshot } from './hooks/useEngineSnapshot';
import { FieldResolver } from './FieldResolver';
import type { FieldComponentMap } from './types';

export interface ControllerProps {
  engine: FormEngine;
  formId: string;
  components?: FieldComponentMap;
  onChange: (key: string, value: unknown) => void;
  onCommit: (key: string, value: unknown) => void;
  onBlur: (key: string) => void;
  onFocus: (key: string) => void;
}

interface FormFieldControllerProps extends ControllerProps {
  field: FormFieldType;
  options?: FieldOption[];
  disabled?: boolean;
  path?: string;
  item?: Record<string, unknown>;
}

export const FormFieldController = memo(function FormFieldController({
  engine,
  formId,
  field,
  options,
  disabled,
  components,
  path,
  item,
  onChange,
  onCommit,
  onBlur,
  onFocus,
}: FormFieldControllerProps) {
  const key = path ?? field.key;
  useFieldSnapshot(engine, key);
  useRecallSnapshot(engine, recalls(engine, field));

  const handleChange = useCallback((value: unknown) => onChange(key, value), [key, onChange]);
  const handleCommit = useCallback((value: unknown) => onCommit(key, value), [key, onCommit]);
  const handleBlur = useCallback(() => onBlur(key), [key, onBlur]);
  const handleFocus = useCallback(() => onFocus(key), [key, onFocus]);
  const fieldWithOptions = { ...field, ...(options && { options }), ...(path && { key: path, autoAdvance: undefined }) };

  return (
    <FieldResolver
      id={path ? errorDomId(engine, formId, path) : fieldDomId(formId, key, engine.definition)}
      field={recalled(engine, fieldWithOptions, path)}
      value={item ? item[field.key] : engine.values[key]}
      error={engine.errors[key]}
      loading={engine.fieldLoading[key]}
      disabled={disabled}
      components={components}
      onChange={handleChange}
      onCommit={handleCommit}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );
});
