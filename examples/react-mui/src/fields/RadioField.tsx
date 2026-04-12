import type { FieldComponentProps } from '@formhaus/react';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';

export function RadioField({
  field,
  value,
  error,
  loading,
  disabled,
  onChange,
}: FieldComponentProps) {
  return (
    <FormControl error={!!error} disabled={disabled || loading} sx={{ mt: 1, mb: 0.5 }}>
      <FormLabel id={`${field.key}-label`}>{field.label}</FormLabel>
      <RadioGroup
        aria-labelledby={`${field.key}-label`}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {(field.options ?? []).map((opt) => (
          <FormControlLabel key={opt.value} value={opt.value} control={<Radio />} label={opt.label} />
        ))}
      </RadioGroup>
      {error && <FormHelperText>{error}</FormHelperText>}
      {!error && field.helperText && <FormHelperText>{field.helperText}</FormHelperText>}
    </FormControl>
  );
}
