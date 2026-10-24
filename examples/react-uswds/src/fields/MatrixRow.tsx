import { type ControlShellProps, mapControls } from '@formhaus/react/controls';
import { Choices } from './controls';

function MatrixShell({ f, rootProps, children }: ControlShellProps) {
  return (
    <div
      {...rootProps}
      className={f.invalid ? 'usa-form-group usa-form-group--error matrix__row' : 'usa-form-group matrix__row'}
      role="radiogroup"
      aria-labelledby={`${f.id}-label`}
    >
      <span id={`${f.id}-label`} className="matrix__label">
        {f.label}
      </span>
      {children}
      {f.helperText && (
        <span id={f.helperId} className="usa-hint matrix__hint">
          {f.helperText}
        </span>
      )}
      {f.error && (
        <span id={f.errorId} className="usa-error-message matrix__error" role="alert">
          {f.error}
        </span>
      )}
    </div>
  );
}

export const MatrixRow = mapControls({
  shell: MatrixShell,
  controls: { radio: [Choices, (f, options) => ({ f, options, matrix: true })] },
}).radio;
