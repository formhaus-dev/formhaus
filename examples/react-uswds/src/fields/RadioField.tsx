import type { FieldComponentProps } from '@formhaus/react';
import { describedBy, optionId, pick, scalePoints } from './field';
import { FormGroup } from './FormGroup';

export function RadioField({
  id = '',
  field,
  value,
  error,
  loading,
  disabled,
  optionTestId,
  onChange,
  onCommit,
  onBlur,
  onFocus,
  matrix,
}: FieldComponentProps) {
  const numeric = field.type === 'scale' || field.type === 'rating';
  const scale = scalePoints(field);
  const options = matrix
    ? matrix.columns
    : numeric
      ? scale.points.map((point) => ({ value: String(point), label: String(point), image: undefined }))
      : (field.options ?? []);
  const tiles = options.some((option) => option.image);
  const choose = (next: string) => pick(field, numeric ? Number(next) : next, onChange, onCommit);

  const radios = options.map((option, index) => (
    <div key={option.value} className={matrix ? 'usa-radio matrix__cell' : 'usa-radio'}>
      <input
        id={optionId(id, index)}
        className={tiles ? 'usa-radio__input usa-radio__input--tile' : 'usa-radio__input'}
        type="radio"
        name={field.key}
        value={option.value}
        checked={String(value ?? '') === option.value}
        disabled={disabled || loading}
        aria-invalid={error ? true : undefined}
        data-testid={optionTestId?.(option.value)}
        onChange={() => choose(option.value)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
      <label className="usa-radio__label" htmlFor={optionId(id, index)}>
        {option.image && <img src={option.image} alt="" className="choice__image" />}
        {matrix ? <span className="usa-sr-only">{option.label}</span> : option.label}
        {field.type === 'rating' && <span className="usa-sr-only"> {option.value === '1' ? 'star' : 'stars'}</span>}
      </label>
    </div>
  ));

  if (matrix)
    return (
      <div
        className={error ? 'usa-form-group usa-form-group--error matrix__row' : 'usa-form-group matrix__row'}
        data-fh="field"
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy(id, field, error)}
      >
        <span id={`${id}-label`} className="matrix__label">
          {field.label}
        </span>
        {radios}
        {error && (
          <span id={`${id}-error`} className="usa-error-message matrix__error" role="alert">
            {error}
          </span>
        )}
      </div>
    );

  return (
    <FormGroup id={id} field={field} error={error} fieldset>
      <div className={[numeric && 'scale', tiles && 'tiles', field.layout === 'inline' && 'inline'].filter(Boolean).join(' ') || undefined}>
        {radios}
      </div>
      {numeric && (scale.start || scale.end) && (
        <div className="usa-hint scale__anchors" aria-hidden="true">
          <span>{scale.start}</span>
          <span>{scale.middle}</span>
          <span>{scale.end}</span>
        </div>
      )}
    </FormGroup>
  );
}
