import type { FieldProps } from '@formhaus/react';
import { Button, FileUpload, HStack, Text } from '@chakra-ui/react';

const list = (f: FieldProps) => ({
  maxFiles: Number.POSITIVE_INFINITY,
  acceptedFiles: Array.isArray(f.value) ? (f.value as File[]) : [],
  onChange: undefined,
  onFileAccept: ({ files }: FileUpload.FileAcceptDetails) => f.change(files),
  translations: { deleteFile: (file: File) => `Remove ${file.name}` },
});

export function FileField({ f, multiple, ...props }: FileUpload.RootProps & { f: FieldProps; multiple?: boolean }) {
  return (
    <FileUpload.Root {...props} {...(multiple ? list(f) : { maxFiles: 1 })}>
      <FileUpload.HiddenInput />
      <HStack gap="3">
        <FileUpload.Trigger asChild>
          <Button id={f.id} variant="outline" size="sm" aria-describedby={f.describedBy}>
            {f.placeholder ?? (multiple ? 'Add files' : 'Choose a file')}
          </Button>
        </FileUpload.Trigger>
        {!multiple && (
          <Text textStyle="sm" color="fg.muted">
            {f.value instanceof File ? f.value.name : 'No file chosen'}
          </Text>
        )}
      </HStack>
      {multiple && <FileUpload.List clearable />}
    </FileUpload.Root>
  );
}
