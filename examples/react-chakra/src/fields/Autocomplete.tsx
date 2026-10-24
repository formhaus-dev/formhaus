import type { ControlOption } from '@formhaus/react/controls';
import { Combobox, useFilter, useListCollection } from '@chakra-ui/react';

interface AutocompleteProps extends Omit<Combobox.InputProps, 'value' | 'onChange'> {
  options: ControlOption[];
  value: string;
  onChange: (text: string) => void;
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
      inputValue={value}
      value={options.filter((option) => option.label === value).map((option) => String(option.value))}
      onInputValueChange={({ inputValue }) => {
        filter(inputValue);
        onChange(inputValue);
      }}
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
