import type { FieldProps } from '@formhaus/react';
import type { ControlShellProps } from '@formhaus/react/controls';
import { Form, Typography } from 'antd';

export const RequiredMark = ({ f }: { f: FieldProps }) =>
  f.required && (
    <span className="required-mark" aria-hidden="true">
      *
    </span>
  );

export function Shell({ kind, f, rootProps, anchors, children }: ControlShellProps) {
  const item = (
    <Form.Item
      label={kind === 'input' ? f.label : undefined}
      htmlFor={f.id}
      required={f.required}
      validateStatus={f.invalid ? 'error' : undefined}
      help={f.error && <div id={f.errorId}>{f.error}</div>}
      extra={f.helperText && <div id={f.helperId}>{f.helperText}</div>}
    >
      {kind === 'inline' ? (
        <span className="inline-label">
          {children}
          <label htmlFor={f.id}>
            <RequiredMark f={f} />
            {f.label}
          </label>
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
        <RequiredMark f={f} />
        {f.label}
      </legend>
      {item}
    </fieldset>
  ) : (
    <div {...rootProps}>{item}</div>
  );
}
