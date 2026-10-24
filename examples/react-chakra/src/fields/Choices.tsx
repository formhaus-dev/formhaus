import type { ControlOption } from '@formhaus/react/controls';
import { HStack, Image, RadioCard, RadioGroup, SimpleGrid, Stack } from '@chakra-ui/react';

interface ChoicesProps extends Omit<RadioGroup.RootProps, 'size'> {
  options: ControlOption[];
  inline: boolean;
}

export const optionIds = (id: string | undefined, options: ControlOption[]) => ({
  label: `${id}-label`,
  itemHiddenInput: (value: string) => {
    const index = options.findIndex((option) => String(option.value) === value);
    return index > 0 ? `${id}-${index}` : `${id}`;
  },
});

export function Choices({ options, inline, ...props }: ChoicesProps) {
  const ids = optionIds(props.id, options);
  if (options.some((option) => option.image))
    return (
      <RadioCard.Root {...props} ids={ids}>
        <SimpleGrid columns={{ base: 1, sm: Math.min(options.length, 3) }} gap="3">
          {options.map((option) => (
            <RadioCard.Item key={option.value} value={String(option.value)}>
              <RadioCard.ItemHiddenInput />
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
    );
  const Options = inline ? HStack : Stack;
  return (
    <RadioGroup.Root {...props} ids={ids}>
      <Options gap={inline ? '6' : '2'} wrap="wrap">
        {options.map((option) => (
          <RadioGroup.Item key={option.value} value={String(option.value)}>
            <RadioGroup.ItemHiddenInput />
            <RadioGroup.ItemIndicator />
            <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
          </RadioGroup.Item>
        ))}
      </Options>
    </RadioGroup.Root>
  );
}
