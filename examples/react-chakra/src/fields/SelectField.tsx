import type { FieldComponentProps } from '@formhaus/react';
import { Select, createListCollection } from '@chakra-ui/react';
import { useMemo } from 'react';
import { FieldShell } from './shared';

export function SelectField(props: FieldComponentProps) {
  const { id, field, value, onChange, onBlur, onFocus } = props;
  const multiple = field.type === 'multiselect';
  const collection = useMemo(() => createListCollection({ items: field.options ?? [] }), [field.options]);
  const selected = multiple ? (Array.isArray(value) ? (value as string[]) : []) : value ? [String(value)] : [];

  return (
    <FieldShell props={props} bind={false}>
      <Select.Root
        collection={collection}
        ids={{ trigger: id }}
        multiple={multiple}
        name={field.key}
        value={selected}
        positioning={{ sameWidth: true }}
        onValueChange={(details) => onChange(multiple ? details.value : (details.value[0] ?? ''))}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger onBlur={onBlur} onFocus={onFocus}>
            <Select.ValueText placeholder={field.placeholder ?? 'Select'} />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Select.Positioner>
          <Select.Content>
            {collection.items.map((option) => (
              <Select.Item key={option.value} item={option}>
                {option.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Select.Root>
    </FieldShell>
  );
}
