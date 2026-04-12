import type { FieldComponentProps } from '@formhaus/react';
import MuiTextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

export function SelectField({
  field,
  value,
  error,
  loading,
  disabled,
  onChange,
}: FieldComponentProps) {
  const options = field.options ?? [];
  const isMulti = field.type === 'multiselect';
  const selectValue = isMulti
    ? Array.isArray(value) ? value : []
    : (value as string) ?? '';

  return (
    <MuiTextField
      id={field.key}
      label={field.label}
      select
      value={selectValue}
      onChange={(e) => onChange(e.target.value)}
      error={!!error}
      helperText={error || field.helperText}
      disabled={disabled || loading}
      fullWidth
      margin="normal"
      slotProps={{
        select: { multiple: isMulti },
      }}
    >
      {!isMulti && (
        <MenuItem value="">
          {field.placeholder || 'Select...'}
        </MenuItem>
      )}
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </MuiTextField>
  );
}
