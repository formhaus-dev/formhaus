import { memo } from 'react';
import { type ControllerProps, FormFieldController } from './FormFieldController';
import { useFormSnapshot, useStructureSnapshot } from './hooks/useEngineSnapshot';
import { useFieldOptions } from './hooks/useFieldOptions';
import type { OptionsProvider } from './types';

interface FormFieldsControllerProps extends ControllerProps {
  loading: boolean;
  optionsProviders?: Record<string, OptionsProvider>;
}

export const FormFieldsController = memo(function FormFieldsController({
  engine,
  loading,
  components,
  optionsProviders,
  onChange,
  onCommit,
  onBlur,
  onFocus,
}: FormFieldsControllerProps) {
  useStructureSnapshot(engine);
  useFormSnapshot(engine);
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
          disabled={loading || engine.stepValidating || engine.submitting}
          components={components}
          onChange={onChange}
          onCommit={onCommit}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      ))}
    </div>
  );
});
