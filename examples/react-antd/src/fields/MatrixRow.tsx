import { type ControlShellProps, mapControls } from '@formhaus/react/controls';
import { Radio, Typography } from 'antd';
import { RequiredMark } from './Shell';

function MatrixShell({ f, rootProps, children }: ControlShellProps) {
  const { 'aria-invalid': _invalid, 'aria-describedby': _describedBy, ...root } = rootProps;
  return (
    <div {...root} className="matrix-row">
      <span className="matrix-row__label">
        <span id={`${f.id}-label`}>
          <RequiredMark f={f} />
          {f.label}
        </span>
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
    radio: {
      component: Radio.Group,
      props: (f, options) => ({
        id: undefined,
        className: 'matrix-row__cells',
        'aria-labelledby': `${f.id}-label`,
        'aria-describedby': f.describedBy,
        'aria-invalid': f.invalid || undefined,
        children: options.map((column, index) => (
          <span key={column.value} className="matrix-row__cell">
            <Radio id={f.optionId(index)} value={column.value} aria-label={column.label} />
          </span>
        )),
      }),
    },
  },
}).radio;
