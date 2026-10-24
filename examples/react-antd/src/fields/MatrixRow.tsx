import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { Radio, Typography } from 'antd';

export function MatrixRow(props: FieldComponentProps) {
  const f = fieldProps(props);
  return (
    <Radio.Group
      {...f.aria}
      data-fh="field"
      name={f.name}
      className="matrix-row"
      aria-labelledby={`${f.id}-label`}
      value={f.value ?? null}
      disabled={f.disabled}
      onChange={(event) => f.change(event.target.value)}
      onBlur={f.blur}
      onFocus={f.focus}
    >
      <span className="matrix-row__label">
        <span id={`${f.id}-label`}>{f.label}</span>
        {f.helperText && (
          <Typography.Text id={f.helperId} type="secondary">
            {f.helperText}
          </Typography.Text>
        )}
        {f.error && (
          <Typography.Text id={f.errorId} type="danger">
            {f.error}
          </Typography.Text>
        )}
      </span>
      {f.options.map((column, index) => (
        <span key={column.value} className="matrix-row__cell">
          <Radio id={f.optionId(index)} value={column.value} aria-label={column.label} />
        </span>
      ))}
    </Radio.Group>
  );
}
