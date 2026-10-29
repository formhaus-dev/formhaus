import type { FormField } from '@formhaus/core';
import { fileEntries, filesFull, pickFiles, removeFile } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import { Button, FileInput, type FileInputProps, Group, Stack, Text, VisuallyHidden } from '@mantine/core';
import { useState } from 'react';

type FileFieldProps = FileInputProps & { f: FieldProps; field: FormField };

function FileList({ f, field, value: _, defaultValue: __, onChange: ___, ...props }: FileFieldProps) {
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('');
  return (
    <Stack gap="xs">
      <FileInput
        {...props}
        multiple
        clearable={false}
        value={[]}
        disabled={props.disabled || filesFull(field, f.value)}
        placeholder={f.placeholder ?? 'Add files'}
        onChange={(files) => {
          if (!files.length) return;
          const result = pickFiles(field, f.value, files);
          if (result.value) f.change(result.value);
          setNotice(result.notice);
          setStatus(result.status);
        }}
      />
      {fileEntries(f.value).map(({ index, name }) => (
        <Group key={index} justify="space-between" wrap="nowrap" gap="sm">
          <Text size="sm" style={{ overflowWrap: 'anywhere' }} dir="auto">
            {name}
          </Text>
          <Button
            variant="subtle"
            color="red"
            size="compact-sm"
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
        </Group>
      ))}
      {notice && (
        <Text size="sm" c="dimmed">
          {notice}
        </Text>
      )}
      <VisuallyHidden role="status">{status}</VisuallyHidden>
    </Stack>
  );
}

export function FileField({ f, field, multiple, ...props }: FileFieldProps) {
  return multiple ? <FileList {...props} f={f} field={field} /> : <FileInput {...props} />;
}
