import type { ControlOption } from '@formhaus/react/controls';
import { HStack, Image, RadioCard, RadioGroup, SimpleGrid, Stack } from '@chakra-ui/react';
import { Fragment, useContext } from 'react';
import { Inline } from './Shell';

interface ChoicesProps extends Omit<RadioGroup.RootProps, 'size'> {
  options: ControlOption[];
}

export const optionIds = (id: string | undefined, options: ControlOption[]) => ({
  label: `${id}-label`,
  itemHiddenInput: (value: string) => {
    const index = options.findIndex((option) => String(option.value) === value);
    return index > 0 ? `${id}-${index}` : `${id}`;
  },
});

export function Choices({ options, ...props }: ChoicesProps) {
  const ids = optionIds(props.id, options);
  const inline = useContext(Inline);
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
          <Fragment key={option.value}>
            <RadioGroup.Item value={String(option.value)}>
              <RadioGroup.ItemHiddenInput aria-controls={option.reveal?.id} />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
            </RadioGroup.Item>
            {option.reveal && (
              <Stack
                id={option.reveal.id}
                data-fh="reveal"
                hidden={!option.reveal.open}
                gap="6"
                ms="2"
                ps="5"
                borderStartWidth="2px"
                borderColor="border"
              >
                {option.reveal.children}
              </Stack>
            )}
          </Fragment>
        ))}
      </Options>
    </RadioGroup.Root>
  );
}
