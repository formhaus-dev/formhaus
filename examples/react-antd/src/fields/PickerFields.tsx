import type { FieldComponentProps } from '@formhaus/react';
import { Button, DatePicker, TimePicker, Upload } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { FieldItem } from './FieldItem';

dayjs.extend(customParseFormat);

const formats = { date: 'YYYY-MM-DD', time: 'HH:mm', datetime: 'YYYY-MM-DDTHH:mm' } as const;

function parse(value: unknown, format: string) {
  if (typeof value !== 'string' || !value) return null;
  const parsed = dayjs(value, format);
  return parsed.isValid() ? parsed : null;
}

export function DateField({ id, field, value, error, loading, disabled, onChange, onBlur, onFocus }: FieldComponentProps) {
  const time = field.type === 'time';
  const format = formats[field.type as keyof typeof formats] ?? formats.date;
  const shared = { id, style: { width: '100%' }, disabled: disabled || loading, onBlur, onFocus };
  return (
    <FieldItem id={id} field={field} error={error}>
      {time ? (
        <TimePicker
          {...shared}
          format="HH:mm"
          value={parse(value, format)}
          onChange={(next) => onChange(next ? next.format(format) : undefined)}
        />
      ) : (
        <DatePicker
          {...shared}
          showTime={field.type === 'datetime' ? { format: 'HH:mm' } : undefined}
          format={field.type === 'datetime' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'}
          value={parse(value, format)}
          onChange={(next) => onChange(next ? next.format(format) : undefined)}
        />
      )}
    </FieldItem>
  );
}

export function FileField({ id, field, value, error, loading, disabled, onChange }: FieldComponentProps) {
  const file = value instanceof File ? value : null;
  return (
    <FieldItem id={id} field={field} error={error}>
      <Upload
        accept={field.accept}
        maxCount={1}
        disabled={disabled || loading}
        fileList={file ? [{ uid: file.name, name: file.name, status: 'done' }] : []}
        beforeUpload={(next) => {
          onChange(next);
          return false;
        }}
        onRemove={() => onChange(null)}
      >
        <Button id={id}>Choose file</Button>
      </Upload>
    </FieldItem>
  );
}
