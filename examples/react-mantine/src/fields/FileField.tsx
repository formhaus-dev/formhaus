import { addFiles, fileEntries, removeFile } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import { Button, FileInput, type FileInputProps, Group, Stack, Text } from '@mantine/core';

export function FileField({ f, multiple, ...props }: FileInputProps & { f: FieldProps }) {
  if (!multiple) return <FileInput {...props} />;
  const { value: _, defaultValue: __, onChange: ___, ...picker } = props;
  return (
    <Stack gap="xs">
      <FileInput
        {...picker}
        multiple
        clearable={false}
        value={[]}
        placeholder={f.placeholder ?? 'Add files'}
        onChange={(files) => files.length > 0 && f.change(addFiles(f.value, files))}
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
            disabled={picker.disabled}
            onClick={() => f.change(removeFile(f.value, index))}
          >
            Remove
          </Button>
        </Group>
      ))}
    </Stack>
  );
}
