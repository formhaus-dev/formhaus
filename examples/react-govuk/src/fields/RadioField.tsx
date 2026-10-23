import type { FieldComponentProps } from '@formhaus/react';
import { FormGroup } from './FormGroup';

export function RadioField({
  id,
  field,
  value,
  error,
  loading,
  disabled,
  onChange,
  onCommit,
  onBlur,
  onFocus,
  matrix,
}: FieldComponentProps) {
  const options = matrix ? matrix.columns : (field.options ?? []);
  const scale = field.type === 'scale' || field.type === 'rating';
  const min = field.type === 'rating' ? 1 : (field.validation?.min ?? 1);
  const max = field.validation?.max ?? 5;
  const points = scale
    ? Array.from({ length: Math.min(11, Math.max(0, max - min + 1)) }, (_, index) => ({
        value: String(min + index),
        label: String(min + index),
      }))
    : options;
  const anchors = scale
    ? [field.options?.find((option) => option.value === String(min)), field.options?.find((option) => option.value === String(max))]
    : [];
  const pick = (next: string) => {
    const parsed = scale ? Number(next) : next;
    (field.autoAdvance && onCommit ? onCommit : onChange)(parsed);
  };
  const inline = scale || !!matrix || points.length <= 2;

  return (
    <FormGroup id={id} field={field} error={error} fieldset>
      {scale && anchors.every(Boolean) && (
        <div className="govuk-hint">
          {min} is {anchors[0]?.label.toLowerCase()}, {max} is {anchors[1]?.label.toLowerCase()}
        </div>
      )}
      <div
        className={['govuk-radios', inline && 'govuk-radios--inline', (scale || matrix) && 'govuk-radios--small'].filter(Boolean).join(' ')}
        data-module="govuk-radios"
      >
        {points.map((option, index) => {
          const optionId = index === 0 ? id : `${id}-${index}`;
          return (
            <div key={option.value} className="govuk-radios__item">
              <input
                id={optionId}
                className="govuk-radios__input"
                name={field.key}
                type="radio"
                value={option.value}
                checked={String(value ?? '') === option.value}
                disabled={disabled || loading}
                onChange={() => pick(option.value)}
                onBlur={onBlur}
                onFocus={onFocus}
              />
              <label className="govuk-label govuk-radios__label" htmlFor={optionId}>
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
    </FormGroup>
  );
}
