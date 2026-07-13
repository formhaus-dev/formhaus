import type { FormEngine } from '@formhaus/core';
import { memo } from 'react';
import { FormFieldController } from './FormFieldController';
import { useStructureSnapshot } from './hooks/useEngineSnapshot';
import { useFieldOptions } from './hooks/useFieldOptions';
import type { FieldComponentMap, OptionsProvider } from './types';

interface FormFieldsControllerProps {
  engine: FormEngine;
  loading: boolean;
  components?: FieldComponentMap;
  optionsProviders?: Record<string, OptionsProvider>;
  onChange: (key: string, value: unknown) => void;
  onBlur: (key: string) => void;
  onFocus: (key: string) => void;
}

export const FormFieldsController = memo(function FormFieldsController({
  engine,
  loading,
  components,
  optionsProviders,
  onChange,
  onBlur,
  onFocus,
}: FormFieldsControllerProps) {
  useStructureSnapshot(engine);
  const fields = engine.visibleFields;
  const resolvedOptions = useFieldOptions(fields, engine, optionsProviders);

  return (
    <div className="fh-form__fields">
      {fields.map((field) => (
        <FormFieldController
          key={field.key}
          engine={engine}
          field={field}
          options={resolvedOptions[field.key] ?? field.options}
          disabled={loading}
          components={components}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      ))}
    </div>
  );
});
