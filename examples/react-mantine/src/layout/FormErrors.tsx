import type { FormErrorsComponentProps } from '@formhaus/react';
import { Alert, Text } from '@mantine/core';

export function FormErrors({ rootProps, errors }: FormErrorsComponentProps) {
  return (
    <Alert color="red" variant="light" my="lg" {...rootProps}>
      {errors.map((error, index) => (
        <Text key={index} size="sm">
          {error}
        </Text>
      ))}
    </Alert>
  );
}
