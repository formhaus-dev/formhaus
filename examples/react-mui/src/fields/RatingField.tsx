import type { FieldComponentProps } from '@formhaus/react';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Rating from '@mui/material/Rating';

export function RatingField({ id, field, value, error, loading, disabled, onChange, onBlur }: FieldComponentProps) {
  return (
    <FormControl error={!!error} disabled={disabled || loading} sx={{ mt: 1, mb: 0.5 }}>
      <FormLabel id={`${id}-label`}>{field.label}</FormLabel>
      <Rating
        name={id}
        aria-labelledby={`${id}-label`}
        max={field.validation?.max ?? 5}
        value={typeof value === 'number' ? value : null}
        disabled={disabled || loading}
        size="large"
        sx={{ mt: 0.5 }}
        onChange={(_, next) => onChange(next ?? undefined)}
        onBlur={onBlur}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
      {!error && field.helperText && <FormHelperText>{field.helperText}</FormHelperText>}
    </FormControl>
  );
}
