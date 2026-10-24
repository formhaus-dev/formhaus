import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { Button, Form, Upload } from 'antd';
import { help } from './Shell';

export function FileField(props: FieldComponentProps) {
  const f = fieldProps(props);
  const file = f.value instanceof File ? f.value : null;
  return (
    <div data-fh="field">
      <Form.Item label={f.label} htmlFor={f.id} required={f.required} validateStatus={f.invalid ? 'error' : undefined} help={help(f)}>
        <Upload
          accept={props.field.accept}
          maxCount={1}
          disabled={f.disabled}
          fileList={file ? [{ uid: file.name, name: file.name, status: 'done' }] : []}
          beforeUpload={(next) => {
            f.change(next);
            return false;
          }}
          onRemove={() => f.change(null)}
        >
          <Button {...f.attrs}>Choose file</Button>
        </Upload>
      </Form.Item>
    </div>
  );
}
