import type { FieldComponentProps } from '@formhaus/react';
import MuiTextField from '@mui/material/TextField';

export function TextField({
  field,
  value,
  error,
  loading,
  disabled,
  onChange,
}: FieldComponentProps) {
  const inputType =
    field.type === 'email' ? 'email'
    : field.type === 'password' ? 'password'
    : field.type === 'number' ? 'number'
    : field.type === 'date' ? 'date'
    : field.type === 'phone' ? 'tel'
    : 'text';

  return (
    <MuiTextField
      id={field.key}
      label={field.label}
      type={inputType}
      value={value != null ? String(value) : ''}
      placeholder={field.placeholder}
      onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
      error={!!error}
      helperText={error || field.helperText}
      disabled={disabled || loading}
      fullWidth
      margin="normal"
      slotProps={{
        inputLabel: field.type === 'date' ? { shrink: true } : undefined,
      }}
    />
  );
}
