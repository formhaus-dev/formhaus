import type { FieldComponentProps } from '@formhaus/react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';

export function CheckboxField({
  id,
  field,
  value,
  error,
  loading,
  disabled,
  onChange,
}: FieldComponentProps) {
  return (
    <div style={{ marginTop: 8, marginBottom: 4 }}>
      <FormControlLabel
        control={
          <Checkbox
            id={id}
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled || loading}
          />
        }
        label={field.label}
      />
      {error && <FormHelperText error>{error}</FormHelperText>}
      {!error && field.helperText && <FormHelperText>{field.helperText}</FormHelperText>}
    </div>
  );
}
