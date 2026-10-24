import type { FieldsContainerProps } from '@formhaus/react';
import { Stack } from '@chakra-ui/react';

export function Fields({ rootProps, children }: FieldsContainerProps) {
  return (
    <Stack gap="6" {...rootProps}>
      {children}
    </Stack>
  );
}
