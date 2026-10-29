import { type FormField, getDefaultMessage } from '@formhaus/core';
import { addFiles, fileEntries, fileLimit, removeFile } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import { Button, FileInput, type FileInputProps, Group, Stack, Text } from '@mantine/core';
import { useState } from 'react';

type FileFieldProps = FileInputProps & { f: FieldProps; field: FormField };

function FileList({ f, field, value: _, defaultValue: __, onChange: ___, ...props }: FileFieldProps) {
  const [notice, setNotice] = useState('');
  const max = fileLimit(field);
  return (
    <Stack gap="xs">
      <FileInput
        {...props}
        multiple
        clearable={false}
        value={[]}
        disabled={props.disabled || addFiles(f.value, []).length >= max}
        placeholder={f.placeholder ?? 'Add files'}
        onChange={(files) => {
          if (!files.length) return;
          const next = addFiles(f.value, files, max);
          setNotice(
            next.length < addFiles(f.value, files).length
              ? (field.validation?.maxLengthMessage ?? getDefaultMessage('maxItems', { max }))
              : '',
          );
          f.change(next);
        }}
      />
      {fileEntries(f.value).map(({ index, name }) => (
        <Group key={index} justify="space-between" wrap="nowrap" gap="sm">
          <Text size="sm" style={{ overflowWrap: 'anywhere' }}>
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
    </Stack>
  );
}

export function FileField({ f, field, multiple, ...props }: FileFieldProps) {
  return multiple ? <FileList {...props} f={f} field={field} /> : <FileInput {...props} />;
}
