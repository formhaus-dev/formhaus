import type { FieldComponentProps } from '@formhaus/react';
import { Button, FileUpload, HStack, Text } from '@chakra-ui/react';
import { FieldShell } from './shared';

export function FileField(props: FieldComponentProps) {
  const { id, field, value, disabled, loading, onChange, onBlur, onFocus } = props;

  return (
    <FieldShell props={props} bind={false}>
      <FileUpload.Root
        name={field.key}
        maxFiles={1}
        accept={field.accept}
        disabled={disabled || loading}
        onFileChange={(details) => onChange(details.acceptedFiles[0] ?? null)}
      >
        <FileUpload.HiddenInput />
        <HStack gap="3">
          <FileUpload.Trigger asChild>
            <Button id={id} variant="outline" size="sm" onBlur={onBlur} onFocus={onFocus}>
              {field.placeholder ?? 'Choose a file'}
            </Button>
          </FileUpload.Trigger>
          <Text textStyle="sm" color="fg.muted">
            {value instanceof File ? value.name : 'No file chosen'}
          </Text>
        </HStack>
      </FileUpload.Root>
    </FieldShell>
  );
}
