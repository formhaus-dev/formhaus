import { type FormField, getDefaultMessage } from '@formhaus/core';
import { addFiles, fileEntries, fileLimit, removeFile } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import { Button, Flex, Typography, Upload, type UploadProps } from 'antd';
import { useState } from 'react';

export const upload = (f: FieldProps, field: FormField): UploadProps & { f: FieldProps; field: FormField } => ({
  f,
  field,
  id: undefined,
  maxCount: 1,
  fileList: f.value instanceof File ? [{ uid: f.value.name, name: f.value.name, status: 'done' }] : [],
  beforeUpload: () => false,
  onChange: ({ file }) => f.change(file.status === 'removed' ? null : (file.originFileObj ?? file)),
  children: <Button {...f.attrs}>Choose file</Button>,
});

const list = (f: FieldProps, field: FormField, notify: (notice: string) => void): UploadProps => {
  const max = fileLimit(field);
  const disabled = f.disabled || addFiles(f.value, []).length >= max;
  const drop = (uid: string) => {
    notify('');
    f.change(removeFile(f.value, Number(uid)));
  };
  return {
    maxCount: max,
    disabled,
    fileList: fileEntries(f.value).map(({ index, name }) => ({ uid: String(index), name, status: 'done' })),
    beforeUpload: (file, batch) => {
      if (file !== batch[batch.length - 1]) return false;
      const next = addFiles(f.value, batch, max);
      notify(
        next.length < addFiles(f.value, batch).length ? (field.validation?.maxLengthMessage ?? getDefaultMessage('maxItems', { max })) : '',
      );
      f.change(next);
      return false;
    },
    onChange: undefined,
    itemRender: (_, file) => (
      <Flex justify="space-between" align="center" gap={8}>
        <Typography.Text style={{ overflowWrap: 'anywhere' }}>{file.name}</Typography.Text>
        <Button type="link" danger size="small" aria-label={`Remove ${file.name}`} disabled={f.disabled} onClick={() => drop(file.uid)}>
          Remove
        </Button>
      </Flex>
    ),
    children: (
      <Button {...f.attrs} disabled={disabled}>
        Add files
      </Button>
    ),
  };
};

export function FileUpload({ f, field, ...props }: UploadProps & { f: FieldProps; field: FormField }) {
  const [notice, setNotice] = useState('');
  if (!props.multiple) return <Upload {...props} />;
  return (
    <>
      <Upload {...props} {...list(f, field, setNotice)} />
      {notice && <Typography.Text type="secondary">{notice}</Typography.Text>}
    </>
  );
}
