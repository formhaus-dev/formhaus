import type { FieldComponentProps } from '@formhaus/react';
import Autocomplete from '@mui/material/Autocomplete';
import MuiTextField from '@mui/material/TextField';

interface Option {
  value: string;
  label: string;
}

export function AutocompleteField({
  field,
  value,
  error,
  loading,
  disabled,
  onChange,
  onBlur,
  onFocus,
}: FieldComponentProps) {
  const options = (field.options ?? []) as Option[];
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Autocomplete
      id={field.key}
      options={options}
      value={selected}
      getOptionLabel={(opt) => opt.label}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      onChange={(_, opt) => onChange(opt?.value ?? '')}
      onBlur={onBlur}
      onFocus={onFocus}
      disabled={disabled || loading}
      fullWidth
      renderInput={(params) => (
        <MuiTextField
          {...params}
          label={field.label}
          placeholder={field.placeholder}
          error={!!error}
          helperText={error || field.helperText}
          margin="normal"
        />
      )}
    />
  );
}
