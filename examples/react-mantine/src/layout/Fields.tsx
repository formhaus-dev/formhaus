import type { FieldsContainerProps } from '@formhaus/react';
import { Stack } from '@mantine/core';

export function Fields({ rootProps, children }: FieldsContainerProps) {
  return (
    <Stack gap="lg" {...rootProps}>
      {children}
    </Stack>
  );
}
