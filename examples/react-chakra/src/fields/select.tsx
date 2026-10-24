import type { FieldProps } from '@formhaus/react';
import type { ControlOption } from '@formhaus/react/controls';
import { createListCollection, Select } from '@chakra-ui/react';
import { labelId } from './Shell';

export const select = (multiple: boolean) => (f: FieldProps, options: ControlOption[]) => ({
  multiple,
  collection: createListCollection<unknown>({ items: options }),
  ids: { label: labelId(f), trigger: f.id },
  lazyMount: true,
  unmountOnExit: true,
  value: Array.isArray(f.value) ? f.value : f.text ? [f.text] : [],
  positioning: { sameWidth: true },
  onValueChange: ({ value }: { value: string[] }) => f.change(multiple ? value : (value[0] ?? '')),
  children: (
    <>
      <Select.Control>
        <Select.Trigger aria-describedby={f.describedBy}>
          <Select.ValueText placeholder={f.placeholder ?? 'Select'} />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          {options.map((option) => (
            <Select.Item key={option.value} item={option}>
              {option.label}
              <Select.ItemIndicator />
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </>
  ),
});
