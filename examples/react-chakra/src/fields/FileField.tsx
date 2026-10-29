import type { FormField } from '@formhaus/core';
import { fileEntries, filesFull, pickFiles, removeFile } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import { Button, FileUpload, HStack, Stack, Text, VisuallyHidden } from '@chakra-ui/react';
import { useState } from 'react';

type FileFieldProps = FileUpload.RootProps & { f: FieldProps; field: FormField; multiple?: boolean };

function FileList({ f, field, ...props }: FileFieldProps) {
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('');
  const accept = ({ files }: FileUpload.FileAcceptDetails) => {
    if (!files.length) return;
    const result = pickFiles(field, f.value, files);
    if (result.value) f.change(result.value);
    setNotice(result.notice);
    setStatus(result.status);
  };
  return (
    <FileUpload.Root
      {...props}
      maxFiles={Number.POSITIVE_INFINITY}
      acceptedFiles={[]}
      onChange={undefined}
      onFileAccept={accept}
      disabled={props.disabled || filesFull(field, f.value)}
    >
      <FileUpload.HiddenInput />
      <FileUpload.Trigger asChild>
        <Button id={f.id} variant="outline" size="sm" aria-describedby={f.describedBy}>
          {f.placeholder ?? 'Add files'}
        </Button>
      </FileUpload.Trigger>
      <Stack gap="2" width="full">
        {fileEntries(f.value).map(({ index, name }) => (
          <HStack key={index} justify="space-between" gap="3" borderWidth="1px" rounded="l2" px="3" py="2">
            <Text textStyle="sm" overflowWrap="anywhere" dir="auto">
              {name}
            </Text>
            <Button
              variant="ghost"
              size="xs"
              aria-label={`Remove ${name}`}
              disabled={props.disabled}
              onClick={() => {
                setNotice('');
                f.change(removeFile(f.value, index));
                setStatus(`${name} removed`);
              }}
            >
              Remove
            </Button>
          </HStack>
        ))}
      </Stack>
      {notice && (
        <Text textStyle="sm" color="fg.muted">
          {notice}
        </Text>
      )}
      <VisuallyHidden role="status">{status}</VisuallyHidden>
    </FileUpload.Root>
  );
}

export function FileField({ f, field, multiple, ...props }: FileFieldProps) {
  if (multiple) return <FileList {...props} f={f} field={field} />;
  return (
    <FileUpload.Root {...props} maxFiles={1}>
      <FileUpload.HiddenInput />
      <HStack gap="3">
        <FileUpload.Trigger asChild>
          <Button id={f.id} variant="outline" size="sm" aria-describedby={f.describedBy}>
            {f.placeholder ?? 'Choose a file'}
          </Button>
        </FileUpload.Trigger>
        <Text textStyle="sm" color="fg.muted">
          {f.value instanceof File ? f.value.name : 'No file chosen'}
        </Text>
      </HStack>
    </FileUpload.Root>
  );
}
