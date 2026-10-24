import { scaleView } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import type { ControlRootProps, ControlShellProps } from '@formhaus/react/controls';

type ShellProps = Omit<ControlShellProps, 'rootProps'> & { rootProps: Partial<ControlRootProps> };

function Label({ f }: { f: FieldProps }) {
  return (
    <>
      {f.label}
      {f.required && (
        <>
          {' '}
          <abbr title="required" className="usa-hint usa-hint--required">
            *
          </abbr>
        </>
      )}
    </>
  );
}

function Notes({ f }: { f: FieldProps }) {
  return (
    <>
      {f.helperText && (
        <div id={f.helperId} className="usa-hint">
          {f.helperText}
        </div>
      )}
      {f.error && (
        <span id={f.errorId} className="usa-error-message" role="alert">
          {f.error}
        </span>
      )}
    </>
  );
}

export function Shell({ kind, field, f, rootProps, children }: ShellProps) {
  const className = f.invalid ? 'usa-form-group usa-form-group--error' : 'usa-form-group';
  const points = field.type === 'scale' || field.type === 'rating';
  const [start, middle, end] = points ? scaleView(field).anchors : [];
  const layout = [
    points && 'scale',
    field.options?.some((option) => option.image) && 'tiles',
    field.layout === 'inline' && 'inline',
  ].filter(Boolean);

  if (kind === 'group')
    return (
      <div className={className}>
        <fieldset {...rootProps} className="usa-fieldset">
          <legend className={f.invalid ? 'usa-legend usa-label--error' : 'usa-legend'}>
            <Label f={f} />
          </legend>
          <Notes f={f} />
          {layout.length ? <div className={layout.join(' ')}>{children}</div> : children}
          {(start || end) && (
            <div className="usa-hint scale__anchors" aria-hidden="true">
              <span>{start?.label}</span>
              <span>{middle?.label}</span>
              <span>{end?.label}</span>
            </div>
          )}
        </fieldset>
      </div>
    );

  if (kind === 'inline')
    return (
      <div {...rootProps} className={className}>
        <Notes f={f} />
        <div className="usa-checkbox">
          {children}
          <label className="usa-checkbox__label" htmlFor={f.id}>
            <Label f={f} />
          </label>
        </div>
      </div>
    );

  return (
    <div {...rootProps} className={className}>
      <label className={f.invalid ? 'usa-label usa-label--error' : 'usa-label'} htmlFor={f.id}>
        <Label f={f} />
      </label>
      <Notes f={f} />
      {children}
    </div>
  );
}
