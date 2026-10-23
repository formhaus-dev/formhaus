import { fieldProps, type FieldComponentProps, type SectionComponentProps } from '@formhaus/react';

export function MatrixSection({ id, title, description, descriptionId, columns, children }: SectionComponentProps) {
  return (
    <fieldset id={id} aria-describedby={descriptionId} className={columns ? 'matrix' : undefined}>
      <legend>{title}</legend>
      {description && <p id={descriptionId}>{description}</p>}
      {columns && (
        <div className="matrix__header" aria-hidden="true">
          {columns.map((column) => (
            <span key={column.value}>{column.label}</span>
          ))}
        </div>
      )}
      {children}
    </fieldset>
  );
}

export function RadioRow(props: FieldComponentProps) {
  const f = fieldProps(props);
  const { matrix } = props;
  return (
    <fieldset data-fh="field" data-row={matrix?.row} className={matrix ? 'matrix__row' : undefined} {...f.aria}>
      <legend>{f.label}</legend>
      {f.options.map((option, index) => (
        <label key={option.value}>
          <input type="radio" {...f.option(option, index)} onChange={() => f.change(option.value)} />
          <span className={matrix ? 'visually-hidden' : undefined}>{option.label}</span>
        </label>
      ))}
      {f.error && <p id={f.errorId}>{f.error}</p>}
    </fieldset>
  );
}
