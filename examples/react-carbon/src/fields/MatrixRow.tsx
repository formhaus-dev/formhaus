import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { RadioButton, TableCell, TableRow } from '@carbon/react';
import { GroupMessage } from './GroupMessage';
import { label } from './labels';

export function MatrixRow(props: FieldComponentProps) {
  const f = fieldProps(props);

  return (
    <TableRow data-fh="field" role="radiogroup" aria-labelledby={`${f.id}-label`} {...f.aria}>
      <TableCell>
        <span id={`${f.id}-label`}>{label(f)}</span>
        <GroupMessage id={f.helperId} helper={f.helperText} />
        <GroupMessage id={f.errorId} error={f.error} />
      </TableCell>
      {f.options.map((column, index) => (
        <TableCell key={column.value}>
          <RadioButton {...f.option(column, index)} labelText={column.label} hideLabel onChange={() => f.change(column.value)} />
        </TableCell>
      ))}
    </TableRow>
  );
}
