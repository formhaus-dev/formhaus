import type { FormErrorsComponentProps } from '@formhaus/react';
import { Alert } from '@chakra-ui/react';

export function FormErrors({ rootProps, errors }: FormErrorsComponentProps) {
  return (
    <Alert.Root status="error" my="6" {...rootProps}>
      <Alert.Indicator />
      <Alert.Content>
        {errors.map((error, index) => (
          <Alert.Description key={index}>{error}</Alert.Description>
        ))}
      </Alert.Content>
    </Alert.Root>
  );
}
