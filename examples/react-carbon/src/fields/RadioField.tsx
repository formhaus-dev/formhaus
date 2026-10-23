import type { FieldComponentProps } from '@formhaus/react';
import { RadioButton, RadioButtonGroup, RadioTile, Stack, TableCell, TableRow, TileGroup } from '@carbon/react';
import { inputProps, pick } from './shared';
import { GroupMessage } from './GroupMessage';

export function RadioField(props: FieldComponentProps) {
  const { field, value, error, matrix } = props;
  const { id, labelText, helperText, invalid, invalidText, disabled, onBlur, onFocus } = inputProps(props);
  const options = field.options ?? [];
  const select = pick(props);
  const selected = value == null || value === '' ? undefined : String(value);

  if (matrix) {
    return (
      <TableRow>
        <TableCell>
          <span id={`${id}-label`}>{labelText}</span>
          {error && (
            <div id={`${id}-error`} className="cds--form-requirement">
              {error}
            </div>
          )}
        </TableCell>
        {matrix.columns.map((column, index) => (
          <TableCell key={column.value}>
            <RadioButton
              id={index === 0 ? id : `${id}-${column.value}`}
              name={field.key}
              value={column.value}
              labelText={`${labelText}: ${column.label}`}
              hideLabel
              disabled={disabled}
              checked={selected === column.value}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={() => select(column.value)}
              onBlur={onBlur}
              onFocus={onFocus}
            />
          </TableCell>
        ))}
      </TableRow>
    );
  }

  if (options.some((option) => option.image)) {
    return (
      <TileGroup legend={labelText} name={field.key} valueSelected={selected} disabled={disabled} onChange={(next) => select(String(next))}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: '1rem' }}>
          {options.map((option, index) => (
            <RadioTile key={option.value} id={index === 0 ? id : `${id}-${option.value}`} value={option.value}>
              <Stack gap={3}>
                {option.image && <img src={option.image} alt="" width="100%" height={96} style={{ objectFit: 'cover' }} />}
                {option.label}
              </Stack>
            </RadioTile>
          ))}
        </div>
        <GroupMessage error={invalidText} helper={helperText} />
      </TileGroup>
    );
  }

  return (
    <RadioButtonGroup
      legendText={labelText}
      name={field.key}
      orientation="vertical"
      helperText={helperText}
      invalid={invalid}
      invalidText={invalidText}
      disabled={disabled}
      valueSelected={selected}
      onChange={(next) => select(String(next))}
    >
      {options.map((option, index) => (
        <RadioButton
          key={option.value}
          id={index === 0 ? id : `${id}-${option.value}`}
          value={option.value}
          labelText={option.label}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      ))}
    </RadioButtonGroup>
  );
}
