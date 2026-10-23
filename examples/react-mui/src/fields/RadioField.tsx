import type { FieldComponentProps } from '@formhaus/react';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

export function RadioField({ id, field, value, error, loading, disabled, onChange, matrix }: FieldComponentProps) {
  if (matrix) {
    return (
      <TableRow role="radiogroup" aria-labelledby={`${id}-label`}>
        <TableCell component="th" scope="row" id={`${id}-label`}>
          {field.label}
          {error && <FormHelperText error>{error}</FormHelperText>}
        </TableCell>
        {matrix.columns.map((column) => (
          <TableCell key={column.value} align="center" padding="checkbox">
            <Radio
              name={id}
              value={column.value}
              checked={value === column.value}
              disabled={disabled || loading}
              inputProps={{ 'aria-label': column.label }}
              onChange={() => onChange(column.value)}
            />
          </TableCell>
        ))}
      </TableRow>
    );
  }

  return (
    <FormControl error={!!error} disabled={disabled || loading} sx={{ mt: 1, mb: 0.5 }}>
      <FormLabel id={`${id}-label`}>{field.label}</FormLabel>
      <RadioGroup aria-labelledby={`${id}-label`} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
        {(field.options ?? []).map((opt) => (
          <FormControlLabel key={opt.value} value={opt.value} control={<Radio />} label={opt.label} />
        ))}
      </RadioGroup>
      {error && <FormHelperText>{error}</FormHelperText>}
      {!error && field.helperText && <FormHelperText>{field.helperText}</FormHelperText>}
    </FormControl>
  );
}
