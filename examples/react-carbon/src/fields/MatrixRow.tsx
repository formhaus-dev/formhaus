import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { RadioButton, TableCell, TableRow } from '@carbon/react';

export function MatrixRow(props: FieldComponentProps) {
  const f = fieldProps(props);

  return (
    <TableRow data-fh="field" role="radiogroup" aria-labelledby={`${f.id}-label`} {...f.aria}>
      <TableCell>
        <span id={`${f.id}-label`}>{f.label}</span>
        {f.helperText && (
          <div id={f.helperId} className="cds--form__helper-text">
            {f.helperText}
          </div>
        )}
        {f.error && (
          <div id={f.errorId} className="cds--form-requirement">
            {f.error}
          </div>
        )}
      </TableCell>
      {f.options.map((column, index) => (
        <TableCell key={column.value}>
          <RadioButton {...f.option(column, index)} labelText={column.label} hideLabel onChange={() => f.change(column.value)} />
        </TableCell>
      ))}
    </TableRow>
  );
}
