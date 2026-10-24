import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { RadioGroup, Table, Text } from '@chakra-ui/react';
import { optionIds } from './Choices';

export function MatrixRow(props: FieldComponentProps) {
  const f = fieldProps(props);

  return (
    <RadioGroup.Root
      asChild
      name={f.name}
      ids={optionIds(f.id, f.options)}
      value={f.text || null}
      disabled={f.disabled}
      invalid={f.invalid}
      aria-labelledby={`${f.id}-label`}
      aria-describedby={f.error && f.errorId}
      onValueChange={({ value }) => value && f.change(value)}
    >
      <Table.Row>
        <Table.Cell>
          <Text id={`${f.id}-label`} textStyle="sm">
            {f.label}
          </Text>
          {f.error && (
            <Text id={f.errorId} textStyle="xs" color="fg.error">
              {f.error}
            </Text>
          )}
        </Table.Cell>
        {f.options.map((column) => (
          <Table.Cell key={column.value} textAlign="center">
            <RadioGroup.Item value={column.value} display="inline-flex">
              <RadioGroup.ItemHiddenInput aria-label={column.label} onBlur={f.blur} onFocus={f.focus} />
              <RadioGroup.ItemIndicator />
            </RadioGroup.Item>
          </Table.Cell>
        ))}
      </Table.Row>
    </RadioGroup.Root>
  );
}
