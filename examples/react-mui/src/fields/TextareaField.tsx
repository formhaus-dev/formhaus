import type { FieldComponentProps } from '@formhaus/react';
import MuiTextField from '@mui/material/TextField';

export function TextareaField({
  field,
  value,
  error,
  loading,
  disabled,
  onChange,
}: FieldComponentProps) {
  return (
    <MuiTextField
      id={field.key}
      label={field.label}
      value={(value as string) ?? ''}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
      error={!!error}
      helperText={error || field.helperText}
      disabled={disabled || loading}
      fullWidth
      multiline
      minRows={field.rows ?? 3}
      margin="normal"
    />
  );
}
