import type { FieldComponentProps } from '@formhaus/react';
import { Image, RadioCard, RadioGroup, SimpleGrid, Stack, Table, Text } from '@chakra-ui/react';
import { GroupShell, pick } from './shared';

export function RadioField(props: FieldComponentProps) {
  const { id, field, value, error, disabled, loading, matrix, onBlur, onFocus } = props;
  const options = field.options ?? [];
  const select = pick(props);
  const selected = value == null || value === '' ? null : String(value);
  const first = (matrix?.columns ?? options)[0]?.value;
  const common = {
    name: field.key,
    ids: { itemHiddenInput: (option: string) => (option === first ? `${id}` : `${id}-${option}`) },
    value: selected,
    disabled: disabled || loading,
    invalid: !!error,
    onValueChange: (details: { value: string | null }) => details.value !== null && select(details.value),
  };

  if (matrix) {
    return (
      <RadioGroup.Root {...common} asChild aria-labelledby={`${id}-label`} aria-describedby={error ? `${id}-error` : undefined}>
        <Table.Row>
          <Table.Cell>
            <Text id={`${id}-label`} textStyle="sm">
              {field.label}
            </Text>
            {error && (
              <Text id={`${id}-error`} textStyle="xs" color="fg.error">
                {error}
              </Text>
            )}
          </Table.Cell>
          {matrix.columns.map((column) => (
            <Table.Cell key={column.value} textAlign="center">
              <RadioGroup.Item value={column.value} display="inline-flex">
                <RadioGroup.ItemHiddenInput aria-label={column.label} onBlur={onBlur} onFocus={onFocus} />
                <RadioGroup.ItemIndicator />
              </RadioGroup.Item>
            </Table.Cell>
          ))}
        </Table.Row>
      </RadioGroup.Root>
    );
  }

  if (options.some((option) => option.image)) {
    return (
      <GroupShell props={props}>
        <RadioCard.Root {...common}>
          <SimpleGrid columns={{ base: 1, sm: Math.min(options.length, 3) }} gap="3">
            {options.map((option) => (
              <RadioCard.Item key={option.value} value={option.value}>
                <RadioCard.ItemHiddenInput onBlur={onBlur} onFocus={onFocus} />
                <RadioCard.ItemControl flexDirection="column" alignItems="stretch">
                  {option.image && <Image src={option.image} alt="" rounded="sm" height="24" objectFit="cover" />}
                  <Stack direction="row" align="center" gap="2">
                    <RadioCard.ItemIndicator />
                    <RadioCard.ItemText>{option.label}</RadioCard.ItemText>
                  </Stack>
                </RadioCard.ItemControl>
              </RadioCard.Item>
            ))}
          </SimpleGrid>
        </RadioCard.Root>
      </GroupShell>
    );
  }

  return (
    <GroupShell props={props}>
      <RadioGroup.Root {...common}>
        <Stack gap="2">
          {options.map((option) => (
            <RadioGroup.Item key={option.value} value={option.value}>
              <RadioGroup.ItemHiddenInput onBlur={onBlur} onFocus={onFocus} />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
            </RadioGroup.Item>
          ))}
        </Stack>
      </RadioGroup.Root>
    </GroupShell>
  );
}
