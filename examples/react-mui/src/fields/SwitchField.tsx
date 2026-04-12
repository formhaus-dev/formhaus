import type { FieldComponentProps } from '@formhaus/react';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Switch from '@mui/material/Switch';

export function SwitchField({
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
          <Switch
            id={field.key}
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
