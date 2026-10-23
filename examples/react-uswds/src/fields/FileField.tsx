import type { FieldComponentProps } from '@formhaus/react';
import { describedBy } from './field';
import { FormGroup } from './FormGroup';

export function FileField({ id = '', field, value, error, loading, disabled, testId, onChange, onBlur, onFocus }: FieldComponentProps) {
  const file = value instanceof File ? value : null;

  return (
    <FormGroup id={id} field={field} error={error}>
      <div className={disabled || loading ? 'usa-file-input usa-file-input--disabled' : 'usa-file-input'}>
        <div className={file ? 'usa-file-input__target has-file' : 'usa-file-input__target'}>
          {file ? (
            <div className="usa-file-input__preview-heading">
              Selected file <span className="usa-file-input__choose">Change file</span>
            </div>
          ) : (
            <div className="usa-file-input__instructions" aria-hidden="true">
              <span className="usa-file-input__drag-text">Drag file here or </span>
              <span className="usa-file-input__choose">choose from folder</span>
            </div>
          )}
          {file && (
            <div className="usa-file-input__preview" aria-hidden="true">
              {file.name}
            </div>
          )}
          <div className="usa-file-input__box" />
          <input
            id={id}
            name={field.key}
            type="file"
            accept={field.accept}
            className="usa-file-input__input"
            disabled={disabled || loading}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, field, error)}
            data-testid={testId}
            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
            onBlur={onBlur}
            onFocus={onFocus}
          />
        </div>
      </div>
    </FormGroup>
  );
}
