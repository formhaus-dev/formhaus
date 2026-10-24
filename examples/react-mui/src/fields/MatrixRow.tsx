import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

export function MatrixRow(props: FieldComponentProps) {
  const f = fieldProps(props);
  return (
    <TableRow
      data-fh="field"
      role="radiogroup"
      aria-labelledby={`${f.id}-label`}
      aria-describedby={f.describedBy}
      aria-invalid={f.aria['aria-invalid']}
    >
      <TableCell component="th" scope="row">
        <FormLabel component="span" id={`${f.id}-label`} required={f.required} sx={{ color: 'text.primary' }}>
          {f.label}
        </FormLabel>
        {f.helperText && (
          <FormHelperText id={f.helperId} variant="standard">
            {f.helperText}
          </FormHelperText>
        )}
        {f.error && (
          <FormHelperText id={f.errorId} variant="standard" error>
            {f.error}
          </FormHelperText>
        )}
      </TableCell>
      {f.options.map((option, index) => (
        <TableCell key={option.value} align="center" padding="checkbox">
          <Radio {...f.option(option, index)} inputProps={{ 'aria-label': option.label }} onChange={() => f.change(option.value)} />
        </TableCell>
      ))}
    </TableRow>
  );
}
