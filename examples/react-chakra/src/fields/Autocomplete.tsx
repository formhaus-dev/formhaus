import type { FieldOption } from '@formhaus/core';
import { optionText, optionValue } from '@formhaus/core/fields';
import { Combobox, useFilter, useListCollection } from '@chakra-ui/react';

interface AutocompleteProps extends Omit<Combobox.InputProps, 'value' | 'onChange'> {
  options: FieldOption[];
  value: string;
  onChange: (value: string) => void;
}

export function Autocomplete({ options, value, onChange, id, name, disabled, ...input }: AutocompleteProps) {
  const { contains } = useFilter({ sensitivity: 'base' });
  const { collection, filter } = useListCollection({ initialItems: options, filter: contains });

  return (
    <Combobox.Root
      id={id}
      name={name}
      disabled={disabled}
      collection={collection}
      allowCustomValue
      lazyMount
      unmountOnExit
      inputBehavior="autohighlight"
      inputValue={optionText(options, value)}
      value={options.some((option) => option.value === value) ? [value] : []}
      onInputValueChange={({ inputValue }) => {
        filter(inputValue);
        onChange(optionValue(options, inputValue));
      }}
      onValueChange={({ value: [picked] }) => picked && onChange(picked)}
    >
      <Combobox.Control>
        <Combobox.Input {...input} />
        <Combobox.IndicatorGroup>
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Combobox.Positioner>
        <Combobox.Content>
          {collection.items.map((option) => (
            <Combobox.Item key={option.value} item={option}>
              {option.label}
              <Combobox.ItemIndicator />
            </Combobox.Item>
          ))}
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox.Root>
  );
}
