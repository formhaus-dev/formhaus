import type { FormField } from '@formhaus/core';
import { Form } from 'antd';
import type { ReactNode } from 'react';

interface FieldItemProps {
  id?: string;
  field: FormField;
  error?: string;
  label?: ReactNode;
  children: ReactNode;
}

export function FieldItem({ id, field, error, label = field.label, children }: FieldItemProps) {
  return (
    <Form.Item
      label={label}
      htmlFor={id}
      required={!!field.validation?.required}
      validateStatus={error ? 'error' : undefined}
      help={error ?? field.helperText}
    >
      {children}
    </Form.Item>
  );
}
