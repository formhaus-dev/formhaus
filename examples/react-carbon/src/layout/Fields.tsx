import type { FieldsContainerProps } from '@formhaus/react';
import { Stack } from '@carbon/react';

export function Fields({ rootProps, children }: FieldsContainerProps) {
  return (
    <Stack gap={7} {...rootProps}>
      {children}
    </Stack>
  );
}
