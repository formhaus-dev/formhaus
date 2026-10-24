import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { Input, Radio, Table, Text } from '@mantine/core';
import { Label } from './labels';

export function MatrixRow(props: FieldComponentProps) {
  const f = fieldProps(props);
  return (
    <Table.Tr data-fh="field">
      <Table.Th scope="row" fw={400}>
        <Text size="sm">
          <Label f={f} />
        </Text>
        {f.helperText && (
          <Input.Description size="xs" id={f.helperId}>
            {f.helperText}
          </Input.Description>
        )}
        {f.error && (
          <Input.Error size="xs" id={f.errorId}>
            {f.error}
          </Input.Error>
        )}
      </Table.Th>
      {f.options.map((column, index) => (
        <Table.Td key={column.value} ta="center">
          <Radio
            {...f.option(column, index)}
            aria-label={`${f.label}: ${column.label}`}
            aria-describedby={f.describedBy}
            error={f.invalid}
            onChange={() => f.change(column.value)}
            styles={{ body: { justifyContent: 'center' } }}
          />
        </Table.Td>
      ))}
    </Table.Tr>
  );
}
