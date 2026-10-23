import type { FieldComponentProps } from '@formhaus/react';
import { useState } from 'react';
import { describedBy } from './field';
import { FormGroup } from './FormGroup';

const kinds: Record<string, { type: string; inputMode?: 'email' | 'tel' | 'decimal'; width?: string }> = {
  email: { type: 'email', inputMode: 'email' },
  phone: { type: 'tel', inputMode: 'tel', width: 'usa-input--xl' },
  number: { type: 'text', inputMode: 'decimal', width: 'usa-input--small' },
  password: { type: 'password' },
};

function toNumber(text: string) {
  if (text.trim() === '') return null;
  const number = Number(text);
  return Number.isNaN(number) ? text : number;
}

export function InputField({ id = '', field, value, error, loading, disabled, testId, onChange, onBlur, onFocus }: FieldComponentProps) {
  const kind = kinds[field.type] ?? { type: 'text' };
  const [shown, setShown] = useState(false);
  const password = field.type === 'password';

  return (
    <FormGroup id={id} field={field} error={error}>
      <input
        id={id}
        name={field.key}
        type={password && shown ? 'text' : kind.type}
        inputMode={field.inputMode ?? kind.inputMode}
        autoComplete={field.autocomplete}
        placeholder={field.placeholder}
        spellCheck={field.type === 'email' || password ? false : undefined}
        className={['usa-input', kind.width, error && 'usa-input--error'].filter(Boolean).join(' ')}
        value={value === undefined || value === null ? '' : String(value)}
        disabled={disabled || loading}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, field, error)}
        data-testid={testId}
        onChange={(event) => onChange(field.type === 'number' ? toNumber(event.target.value) : event.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
      {password && (
        <button type="button" className="usa-show-password" aria-controls={id} onClick={() => setShown(!shown)}>
          {shown ? 'Hide password' : 'Show password'}
        </button>
      )}
    </FormGroup>
  );
}
