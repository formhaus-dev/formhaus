import type { FieldComponentProps } from '@formhaus/react';
import { Combobox, useFilter, useListCollection } from '@chakra-ui/react';
import { FieldShell } from './shared';

export function AutocompleteField(props: FieldComponentProps) {
  const { field, value, onChange, onBlur, onFocus } = props;
  const options = field.options ?? [];
  const { contains } = useFilter({ sensitivity: 'base' });
  const { collection, filter } = useListCollection({ initialItems: options, filter: contains });
  const stored = (value as string) ?? '';
  const text = options.find((option) => option.value === stored)?.label ?? stored;

  return (
    <FieldShell props={props}>
      <Combobox.Root
        collection={collection}
        name={field.key}
        allowCustomValue
        inputValue={text}
        value={options.some((option) => option.value === stored) ? [stored] : []}
        inputBehavior="autohighlight"
        onInputValueChange={(details) => {
          filter(details.inputValue);
          onChange(options.find((option) => option.label === details.inputValue)?.value ?? details.inputValue);
        }}
        onValueChange={(details) => details.value[0] && onChange(details.value[0])}
      >
        <Combobox.Control>
          <Combobox.Input placeholder={field.placeholder} autoComplete={field.autocomplete ?? 'off'} onBlur={onBlur} onFocus={onFocus} />
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
    </FieldShell>
  );
}
