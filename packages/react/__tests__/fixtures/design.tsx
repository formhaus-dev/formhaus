import type { DefaultFieldType } from '@formhaus/core';
import type {
  ConfirmDialogComponentProps,
  ErrorSummaryComponentProps,
  FieldComponentProps,
  FieldsContainerProps,
  FormActionsProps,
  FormErrorsComponentProps,
  FormStepProgressProps,
  GroupComponentProps,
  GroupItemComponentProps,
  LayoutComponentMap,
  SectionComponentProps,
} from '../../src';

const types: DefaultFieldType[] = [
  'text',
  'email',
  'phone',
  'number',
  'password',
  'select',
  'autocomplete',
  'multiselect',
  'checkbox',
  'radio',
  'switch',
  'file',
  'date',
  'datetime',
  'time',
  'textarea',
  'hidden',
  'scale',
  'rating',
];

function Field({ id, field, value, error, matrix, onChange }: FieldComponentProps) {
  return (
    <div className="ds-field">
      <label htmlFor={id}>{field.label}</label>
      <input
        id={id}
        value={typeof value === 'string' ? value : ''}
        aria-invalid={error ? 'true' : undefined}
        data-matrix={matrix && `${matrix.row}/${matrix.columns.length}`}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <p id={`${id}-error`}>{error}</p>}
    </div>
  );
}

const layout: LayoutComponentMap = {
  fields: ({ rootProps, children }: FieldsContainerProps) => (
    <div {...rootProps} className="ds-stack">
      {children}
    </div>
  ),
  section: ({ id, title, columns, children }: SectionComponentProps) => (
    <fieldset id={id} className="ds-section" data-columns={columns?.map((column) => column.label).join()}>
      <legend>{title}</legend>
      {children}
    </fieldset>
  ),
  group: ({ id, label, items, canAdd, add, addLabel, itemComponent: Item }: GroupComponentProps) => (
    <div id={id} className="ds-group">
      <span>{label}</span>
      {items.map((item) => (
        <Item key={item.id} {...item} />
      ))}
      {canAdd && (
        <button type="button" data-fh-group-add onClick={add}>
          {addLabel}
        </button>
      )}
    </div>
  ),
  groupItem: ({ title, titleId, canRemove, requestRemove, removeLabel, removeName, children }: GroupItemComponentProps) => (
    <div data-fh-group-item role="group" aria-labelledby={titleId}>
      <span id={titleId} tabIndex={-1}>
        {title}
      </span>
      {canRemove && (
        <button type="button" id={`${titleId}-remove`} aria-label={removeName} onClick={requestRemove}>
          {removeLabel}
        </button>
      )}
      {children}
    </div>
  ),
  confirmDialog: ({ id, open, title, confirmLabel, cancelLabel, confirm, cancel }: ConfirmDialogComponentProps) => (
    <div id={id} className="ds-dialog" data-open={String(open)} hidden={!open}>
      <p>{title}</p>
      <button type="button" onClick={confirm}>
        {confirmLabel}
      </button>
      <button type="button" onClick={cancel}>
        {cancelLabel}
      </button>
    </div>
  ),
  errorSummary: ({ rootProps, title, groups, count, showField }: ErrorSummaryComponentProps) => (
    <div {...rootProps} className="ds-summary" data-count={count}>
      <strong>{title}</strong>
      {groups.flatMap((group) =>
        group.entries.map((entry) => (
          <a
            key={entry.key}
            href={`#${entry.id}`}
            onClick={(event) => {
              event.preventDefault();
              showField(entry.key);
            }}
          >
            {entry.text}
          </a>
        )),
      )}
    </div>
  ),
  formErrors: ({ rootProps, errors }: FormErrorsComponentProps) => (
    <div {...rootProps} className="ds-errors">
      {errors.map((error) => (
        <p key={error}>{error}</p>
      ))}
    </div>
  ),
  progress: ({ rootProps, current, total, steps, stepErrorsLabel }: FormStepProgressProps) => (
    <div {...rootProps} className="ds-progress" data-errors={stepErrorsLabel}>
      <span>{`${current}/${total}`}</span>
      <ol>
        {steps?.map((step) => (
          <li key={step.id} data-errors={step.errorsLabel}>
            {step.title}
          </li>
        ))}
      </ol>
    </div>
  ),
  actions: ({ rootProps, isFirstStep, primaryLabel, primaryDisabled, onBack, onPrimary }: FormActionsProps) => (
    <div {...rootProps} className="ds-actions">
      {!isFirstStep && (
        <button type="button" onClick={onBack}>
          Back
        </button>
      )}
      <button
        type="submit"
        data-disabled={primaryDisabled}
        onClick={(event) => {
          event.preventDefault();
          onPrimary?.();
        }}
      >
        {primaryLabel}
      </button>
    </div>
  ),
};

export const design = { components: Object.fromEntries(types.map((type) => [type, Field])), layout };
