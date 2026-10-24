import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { Radio, Table, Text } from '@mantine/core';

export function MatrixRow(props: FieldComponentProps) {
  const f = fieldProps(props);
  return (
    <Table.Tr data-fh="field">
      <Table.Th scope="row" fw={400}>
        <Text size="sm">{f.label}</Text>
        {f.helperText && (
          <Text size="xs" c="dimmed" id={f.helperId}>
            {f.helperText}
          </Text>
        )}
        {f.error && (
          <Text size="xs" c="red" id={f.errorId}>
            {f.error}
          </Text>
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
