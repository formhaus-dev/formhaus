import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { Button, FileUpload, HStack, Text } from '@chakra-ui/react';
import { FieldFrame } from './Shell';

export function FileField(props: FieldComponentProps) {
  const f = fieldProps(props);
  const { field, value } = props;

  return (
    <FieldFrame data-fh="field" f={f} label>
      <FileUpload.Root
        name={f.name}
        ids={{ hiddenInput: `${f.id}-input` }}
        maxFiles={1}
        accept={field.accept}
        disabled={f.disabled}
        onFileChange={({ acceptedFiles }) => f.change(acceptedFiles[0] ?? null)}
      >
        <FileUpload.HiddenInput />
        <HStack gap="3">
          <FileUpload.Trigger asChild>
            <Button id={f.id} variant="outline" size="sm" aria-describedby={f.describedBy} onBlur={f.blur} onFocus={f.focus}>
              {f.placeholder ?? 'Choose a file'}
            </Button>
          </FileUpload.Trigger>
          <Text textStyle="sm" color="fg.muted">
            {value instanceof File ? value.name : 'No file chosen'}
          </Text>
        </HStack>
      </FileUpload.Root>
    </FieldFrame>
  );
}
