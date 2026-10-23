import type { FieldComponentProps } from '@formhaus/react';
import { describedBy, FormGroup } from './FormGroup';

const types: Record<string, { type: string; width?: string; inputMode?: 'numeric' | 'tel' | 'email' }> = {
  email: { type: 'email', inputMode: 'email' },
  phone: { type: 'tel', width: 'govuk-input--width-20', inputMode: 'tel' },
  number: { type: 'text', width: 'govuk-input--width-10', inputMode: 'numeric' },
  password: { type: 'password' },
  time: { type: 'time', width: 'govuk-input--width-5' },
  datetime: { type: 'datetime-local', width: 'govuk-input--width-10' },
};

export function InputField({ id, field, value, error, loading, disabled, onChange, onBlur, onFocus }: FieldComponentProps) {
  const kind = types[field.type] ?? { type: 'text' };
  const number = field.type === 'number';

  return (
    <FormGroup id={id} field={field} error={error}>
      <input
        id={id}
        name={field.key}
        type={kind.type}
        inputMode={kind.inputMode}
        autoComplete={field.autocomplete}
        spellCheck={field.type === 'email' ? false : undefined}
        className={['govuk-input', kind.width, error && 'govuk-input--error'].filter(Boolean).join(' ')}
        value={value === undefined || value === null ? '' : String(value)}
        disabled={disabled || loading}
        aria-describedby={describedBy(id, field, error)}
        onChange={(event) => {
          const text = event.target.value;
          onChange(number ? (text === '' || Number.isNaN(Number(text)) ? text || undefined : Number(text)) : text);
        }}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </FormGroup>
  );
}
