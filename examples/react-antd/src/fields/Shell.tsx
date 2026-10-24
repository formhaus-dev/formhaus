import { scaleView } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import type { ControlShellProps } from '@formhaus/react/controls';
import { Form, Typography } from 'antd';

export const help = (f: FieldProps) =>
  (f.helperText || f.error) && (
    <>
      {f.helperText && (
        <div id={f.helperId} className="field-help">
          {f.helperText}
        </div>
      )}
      {f.error && <div id={f.errorId}>{f.error}</div>}
    </>
  );

export function Shell({ kind, field, f, rootProps, children }: ControlShellProps) {
  const anchors = field.type === 'scale' ? scaleView(field).anchors : [];
  const item = (
    <Form.Item
      label={kind === 'input' ? f.label : undefined}
      htmlFor={f.id}
      required={f.required}
      validateStatus={f.invalid ? 'error' : undefined}
      help={help(f)}
    >
      {kind === 'inline' ? (
        <span className="inline-label">
          {children}
          <label htmlFor={f.id}>{f.label}</label>
        </span>
      ) : (
        children
      )}
      {anchors.some(Boolean) && (
        <div className="scale-anchors">
          {anchors.map((anchor, index) => (
            <Typography.Text key={index} type="secondary">
              {anchor?.label}
            </Typography.Text>
          ))}
        </div>
      )}
    </Form.Item>
  );
  return kind === 'group' ? (
    <fieldset {...rootProps} className="choice-group">
      <legend>
        {f.required && (
          <span className="required-mark" aria-hidden="true">
            *
          </span>
        )}
        {f.label}
      </legend>
      {item}
    </fieldset>
  ) : (
    <div {...rootProps}>{item}</div>
  );
}
