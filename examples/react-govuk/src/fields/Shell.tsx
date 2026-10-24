import type { ControlShellProps } from '@formhaus/react/controls';
import { CharacterCount, PasswordInput } from 'govuk-frontend';
import { useContext, useEffect } from 'react';
import { useGovuk } from '../govuk';
import { PageContext } from '../page';
import { Anchors } from './Choices';

const dateTypes = ['date', 'time', 'datetime'];

export function Shell({ kind, field, f, rootProps, anchors, children }: ControlShellProps) {
  const text = f.required ? f.label : `${f.label} (optional)`;
  const heading = useContext(PageContext).soloKeys.has(field.key);
  const maxLength = field.type === 'textarea' ? field.validation?.maxLength : undefined;
  const module = field.type === 'password' ? PasswordInput : maxLength ? CharacterCount : undefined;
  const moduleRef = useGovuk(module);
  const [start, , end] = anchors;
  const anchorsId = start && end ? `${f.id}-anchors` : undefined;
  const infoId = `${f.id}-info`;

  useEffect(() => {
    if (maxLength) document.getElementById(f.id)?.setAttribute('aria-describedby', [infoId, f.describedBy].filter(Boolean).join(' '));
  }, [maxLength, infoId, f.id, f.describedBy]);

  const notes = (
    <>
      {f.helperText && (
        <div id={f.helperId} className="govuk-hint">
          {f.helperText}
        </div>
      )}
      {anchorsId && (
        <div id={anchorsId} className="govuk-hint">
          {start?.point} is {start?.label.toLowerCase()}, {end?.point} is {end?.label.toLowerCase()}
        </div>
      )}
      {f.error && (
        <p id={f.errorId} className="govuk-error-message">
          <span className="govuk-visually-hidden">Error:</span> {f.error}
        </p>
      )}
    </>
  );
  const className = [
    'govuk-form-group',
    f.invalid && 'govuk-form-group--error',
    module === PasswordInput && 'govuk-password-input',
    module === CharacterCount && 'govuk-character-count',
  ]
    .filter(Boolean)
    .join(' ');

  if (kind === 'group')
    return (
      <div className={className}>
        <fieldset
          {...rootProps}
          className="govuk-fieldset"
          role={dateTypes.includes(field.type) ? 'group' : undefined}
          aria-describedby={[anchorsId, rootProps['aria-describedby']].filter(Boolean).join(' ') || undefined}
        >
          <legend className={heading ? 'govuk-fieldset__legend govuk-fieldset__legend--l' : 'govuk-fieldset__legend'}>
            {heading ? <h1 className="govuk-fieldset__heading">{text}</h1> : text}
          </legend>
          {notes}
          <Anchors value={anchors}>{children}</Anchors>
        </fieldset>
      </div>
    );

  if (kind === 'inline')
    return (
      <div {...rootProps} className={className}>
        {notes}
        <div className="govuk-checkboxes">
          <div className="govuk-checkboxes__item">
            {children}
            <label className="govuk-label govuk-checkboxes__label" htmlFor={f.id}>
              {f.label}
            </label>
          </div>
        </div>
      </div>
    );

  const label = (
    <label className={heading ? 'govuk-label govuk-label--l' : 'govuk-label'} htmlFor={f.id}>
      {text}
    </label>
  );
  return (
    <div {...rootProps} className={className} ref={moduleRef} data-module={module?.moduleName} data-maxlength={maxLength}>
      {heading ? <h1 className="govuk-label-wrapper">{label}</h1> : label}
      {notes}
      {children}
      {maxLength && (
        <div id={infoId} className="govuk-hint govuk-character-count__message">
          You can enter up to {maxLength} characters
        </div>
      )}
    </div>
  );
}
