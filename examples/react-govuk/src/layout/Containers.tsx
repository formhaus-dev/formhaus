import type { FormNode } from '@formhaus/core';
import type { FieldsContainerProps, GroupComponentProps, GroupItemComponentProps, SectionComponentProps } from '@formhaus/react';
import { Button } from 'govuk-frontend';
import { useContext } from 'react';
import { useGovuk } from '../govuk';
import { PageContext } from '../page';

const fieldsetTypes = ['radio', 'multiselect', 'scale', 'rating', 'date', 'time', 'datetime', 'group'];
const hasFieldsets = (nodes: FormNode[]): boolean =>
  nodes.some((node) => fieldsetTypes.includes(node.type) || ('fields' in node && hasFieldsets(node.fields)));

export function Fields({ rootProps, children }: FieldsContainerProps) {
  const { title } = useContext(PageContext);
  return (
    <div {...rootProps}>
      {title && <h1 className="govuk-heading-l">{title}</h1>}
      {children}
    </div>
  );
}

export function Section({ id, section, title, description, descriptionId, children }: SectionComponentProps) {
  const hint = description && (
    <div id={descriptionId} className="govuk-hint">
      {description}
    </div>
  );
  if (hasFieldsets(section.fields))
    return (
      <div id={id} className="govuk-!-margin-bottom-6">
        <h2 className="govuk-heading-m">{title}</h2>
        {hint}
        {children}
      </div>
    );
  return (
    <fieldset id={id} className="govuk-fieldset govuk-!-margin-bottom-6" aria-describedby={descriptionId}>
      <legend className="govuk-fieldset__legend govuk-fieldset__legend--m">{title}</legend>
      {hint}
      {children}
    </fieldset>
  );
}

export function Group({
  id,
  label,
  helperText,
  error,
  items,
  canAdd,
  add,
  addLabel,
  disabled,
  status,
  itemComponent: Item,
}: GroupComponentProps) {
  const button = useGovuk(Button);
  return (
    <div id={id} className={error ? 'govuk-form-group govuk-form-group--error' : 'govuk-form-group'}>
      <h2 className="govuk-heading-m">{label}</h2>
      {helperText && (
        <div id={`${id}-helper`} className="govuk-hint">
          {helperText}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="govuk-error-message">
          <span className="govuk-visually-hidden">Error:</span> {error}
        </p>
      )}
      {items.map((item) => (
        <Item key={item.id} {...item} />
      ))}
      {canAdd && (
        <button
          type="button"
          className="govuk-button govuk-button--secondary"
          data-module="govuk-button"
          ref={button}
          disabled={disabled}
          onClick={add}
        >
          {addLabel}
        </button>
      )}
      <p className="govuk-visually-hidden" role="status">
        {status}
      </p>
    </div>
  );
}

export function GroupItem({ title, titleId, canRemove, requestRemove, removeLabel, disabled, children }: GroupItemComponentProps) {
  const button = useGovuk(Button);
  return (
    <fieldset className="govuk-fieldset">
      <legend id={titleId} tabIndex={-1} className="govuk-fieldset__legend govuk-fieldset__legend--s">
        {title}
      </legend>
      {children}
      {canRemove && (
        <button
          type="button"
          className="govuk-button govuk-button--secondary"
          data-module="govuk-button"
          ref={button}
          disabled={disabled}
          onClick={requestRemove}
        >
          {removeLabel}
          <span className="govuk-visually-hidden"> {title}</span>
        </button>
      )}
    </fieldset>
  );
}
