import type { FieldComponentProps } from '@formhaus/react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

export function ScaleField({ id, field, value, error, loading, disabled, onChange, onCommit, onBlur }: FieldComponentProps) {
  const min = field.validation?.min ?? 1;
  const max = field.validation?.max ?? 5;
  const points = Array.from({ length: Math.min(11, Math.max(0, max - min + 1)) }, (_, index) => min + index);
  const anchor = (point: number) => field.options?.find((option) => option.value === String(point))?.label;
  const pick = field.autoAdvance && onCommit ? onCommit : onChange;

  return (
    <FormControl error={!!error} disabled={disabled || loading} fullWidth sx={{ mt: 1, mb: 0.5 }}>
      <FormLabel id={`${id}-label`} required={!!field.validation?.required} sx={{ mb: 1 }}>
        {field.label}
      </FormLabel>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        color="primary"
        aria-labelledby={`${id}-label`}
        value={typeof value === 'number' ? value : null}
        disabled={disabled || loading}
        onChange={(_, next: number | null) => next !== null && pick(next)}
        onBlur={onBlur}
      >
        {points.map((point) => (
          <ToggleButton key={point} value={point} sx={{ py: 1 }}>
            {point}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {(anchor(min) || anchor(max)) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {anchor(min)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {anchor(max)}
          </Typography>
        </Box>
      )}
      {error && <FormHelperText>{error}</FormHelperText>}
      {!error && field.helperText && <FormHelperText>{field.helperText}</FormHelperText>}
    </FormControl>
  );
}
