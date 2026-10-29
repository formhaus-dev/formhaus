import { addFiles, fileEntries, removeFile } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import { Button, Flex, Typography, Upload, type UploadProps } from 'antd';

export const upload = (f: FieldProps): UploadProps & { f: FieldProps } => ({
  f,
  id: undefined,
  maxCount: 1,
  fileList: f.value instanceof File ? [{ uid: f.value.name, name: f.value.name, status: 'done' }] : [],
  beforeUpload: () => false,
  onChange: ({ file }) => f.change(file.status === 'removed' ? null : (file.originFileObj ?? file)),
  children: <Button {...f.attrs}>Choose file</Button>,
});

const list = (f: FieldProps): UploadProps => ({
  maxCount: undefined,
  fileList: fileEntries(f.value).map(({ index, name }) => ({ uid: String(index), name, status: 'done' })),
  beforeUpload: (file, batch) => {
    if (file === batch[batch.length - 1]) f.change(addFiles(f.value, batch));
    return false;
  },
  onChange: undefined,
  onRemove: (file) => f.change(removeFile(f.value, Number(file.uid))),
  itemRender: (_, file, __, { remove }) => (
    <Flex justify="space-between" align="center" gap={8}>
      <Typography.Text style={{ overflowWrap: 'anywhere' }}>{file.name}</Typography.Text>
      <Button type="link" danger size="small" aria-label={`Remove ${file.name}`} disabled={f.disabled} onClick={remove}>
        Remove
      </Button>
    </Flex>
  ),
  children: <Button {...f.attrs}>Add files</Button>,
});

export function FileUpload({ f, ...props }: UploadProps & { f: FieldProps }) {
  return <Upload {...props} {...(props.multiple && list(f))} />;
}
