import { type ControlShellProps, mapControls } from '@formhaus/react/controls';
import { Radio, Typography } from 'antd';

function MatrixShell({ f, rootProps, children }: ControlShellProps) {
  return (
    <div {...rootProps} className="matrix-row">
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
      {children}
    </div>
  );
}

export const MatrixRow = mapControls({
  shell: MatrixShell,
  controls: {
    radio: [
      Radio.Group,
      (f, options) => ({
        id: undefined,
        className: 'matrix-row__cells',
        'aria-labelledby': `${f.id}-label`,
        children: options.map((column, index) => (
          <span key={column.value} className="matrix-row__cell">
            <Radio id={f.optionId(index)} value={column.value} aria-label={column.label} />
          </span>
        )),
      }),
    ],
  },
}).radio;
