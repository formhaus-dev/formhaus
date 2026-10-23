import type { FieldComponentProps } from '@formhaus/react';
import { Group, Image, Radio, SimpleGrid, Stack, Table, Text } from '@mantine/core';
import { inputProps, pick } from './shared';

export function RadioField(props: FieldComponentProps) {
  const { id, field, value, error, matrix } = props;
  const options = field.options ?? [];
  const { disabled, onBlur, onFocus } = inputProps(props);
  const select = pick(props);
  const selected = value == null ? null : String(value);

  if (matrix) {
    return (
      <Table.Tr>
        <Table.Th scope="row" fw={400}>
          <Text size="sm" id={`${id}-label`}>
            {field.label}
          </Text>
          {error && (
            <Text size="xs" c="red" id={`${id}-error`}>
              {error}
            </Text>
          )}
        </Table.Th>
        {matrix.columns.map((column, index) => (
          <Table.Td key={column.value} ta="center">
            <Radio
              id={index === 0 ? id : `${id}-${index}`}
              name={field.key}
              value={column.value}
              aria-label={`${field.label}: ${column.label}`}
              aria-describedby={error ? `${id}-error` : undefined}
              error={!!error}
              disabled={disabled}
              checked={selected === column.value}
              onBlur={onBlur}
              onFocus={onFocus}
              onChange={() => select(column.value)}
              styles={{ body: { justifyContent: 'center' } }}
            />
          </Table.Td>
        ))}
      </Table.Tr>
    );
  }

  const withImages = options.some((option) => option.image);

  return (
    <Radio.Group
      id={id}
      name={field.key}
      label={field.label}
      description={field.helperText}
      error={error}
      withAsterisk={!!field.validation?.required}
      value={selected}
      onChange={select}
    >
      {withImages ? (
        <SimpleGrid cols={{ base: 1, xs: Math.min(options.length, 3) }} mt="xs" mb={4}>
          {options.map((option) => (
            <Radio.Card key={option.value} value={option.value} disabled={disabled} onBlur={onBlur} onFocus={onFocus} p="sm" radius="md">
              <Stack gap="xs">
                {option.image && <Image src={option.image} alt="" radius="sm" h={96} fit="cover" />}
                <Group gap="xs" wrap="nowrap">
                  <Radio.Indicator />
                  <Text size="sm">{option.label}</Text>
                </Group>
              </Stack>
            </Radio.Card>
          ))}
        </SimpleGrid>
      ) : (
        <Stack gap="xs" mt="xs" mb={4}>
          {options.map((option) => (
            <Radio key={option.value} value={option.value} label={option.label} disabled={disabled} onBlur={onBlur} onFocus={onFocus} />
          ))}
        </Stack>
      )}
    </Radio.Group>
  );
}
