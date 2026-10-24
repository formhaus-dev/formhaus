import { scaleView } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import type { ControlShellProps } from '@formhaus/react/controls';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Typography from '@mui/material/Typography';
import type { ReactElement } from 'react';

export const labels = (f: FieldProps) => ({
  label: f.label,
  required: f.required,
  error: f.invalid,
  helperText: f.error ?? f.helperText,
  fullWidth: true,
  margin: 'normal' as const,
  'data-testid': undefined,
  slotProps: {
    inputLabel: { shrink: f.inputType.includes('date') || f.inputType === 'time' || undefined },
    htmlInput: { 'data-testid': f.testId },
  },
});

export function Texts({ f }: Pick<ControlShellProps, 'f'>) {
  return (
    <>
      {f.helperText && <FormHelperText id={f.helperId}>{f.helperText}</FormHelperText>}
      {f.error && <FormHelperText id={f.errorId}>{f.error}</FormHelperText>}
    </>
  );
}

export function InlineShell({ f, rootProps, children }: ControlShellProps) {
  return (
    <FormControl {...rootProps} error={f.invalid} sx={{ mt: 1, mb: 0.5 }}>
      <FormControlLabel control={children as ReactElement} label={f.label} required={f.required} />
      <Texts f={f} />
    </FormControl>
  );
}

export function GroupShell({ field, f, rootProps, children }: ControlShellProps) {
  const anchors = field.type === 'scale' ? scaleView(field).anchors : [];
  return (
    <FormControl {...rootProps} component="fieldset" error={f.invalid} fullWidth sx={{ mt: 1, mb: 0.5 }}>
      <FormLabel component="legend" required={f.required} sx={{ mb: 0.5 }}>
        {f.label}
      </FormLabel>
      {children}
      {anchors.some(Boolean) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          {anchors.map((anchor, index) => (
            <Typography key={index} variant="caption" color="text.secondary">
              {anchor?.label}
            </Typography>
          ))}
        </Box>
      )}
      <Texts f={f} />
    </FormControl>
  );
}
