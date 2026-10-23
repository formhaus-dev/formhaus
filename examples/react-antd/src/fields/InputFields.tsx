import type { FieldComponentProps } from '@formhaus/react';
import { Input, InputNumber } from 'antd';
import { FieldItem } from './FieldItem';

const types: Record<string, string> = { email: 'email', phone: 'tel', password: 'password' };

export function TextField({ id, field, value, error, loading, disabled, onChange, onBlur, onFocus }: FieldComponentProps) {
  const shared = {
    id,
    name: field.key,
    value: typeof value === 'string' ? value : '',
    placeholder: field.placeholder,
    autoComplete: field.autocomplete,
    disabled: disabled || loading,
    onBlur,
    onFocus,
  };
  return (
    <FieldItem id={id} field={field} error={error}>
      {field.type === 'password' ? (
        <Input.Password {...shared} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <Input {...shared} type={types[field.type] ?? 'text'} onChange={(event) => onChange(event.target.value)} />
      )}
    </FieldItem>
  );
}

export function NumberField({ id, field, value, error, loading, disabled, onChange, onBlur, onFocus }: FieldComponentProps) {
  return (
    <FieldItem id={id} field={field} error={error}>
      <InputNumber
        id={id}
        name={field.key}
        style={{ width: '100%' }}
        value={typeof value === 'number' ? value : null}
        min={field.validation?.min}
        max={field.validation?.max}
        placeholder={field.placeholder}
        disabled={disabled || loading}
        onChange={(next) => onChange(next ?? undefined)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </FieldItem>
  );
}

export function TextareaField({ id, field, value, error, loading, disabled, onChange, onBlur, onFocus }: FieldComponentProps) {
  return (
    <FieldItem id={id} field={field} error={error}>
      <Input.TextArea
        id={id}
        name={field.key}
        rows={field.rows ?? 4}
        value={typeof value === 'string' ? value : ''}
        placeholder={field.placeholder}
        disabled={disabled || loading}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </FieldItem>
  );
}

export function HiddenField() {
  return null;
}
