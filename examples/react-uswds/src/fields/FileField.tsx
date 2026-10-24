import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { Shell } from './Shell';

export function FileField(props: FieldComponentProps) {
  const f = fieldProps(props);
  const file = props.value instanceof File ? props.value : null;

  return (
    <Shell kind="input" field={props.field} f={f} rootProps={{ 'data-fh': 'field' }}>
      <div className={f.disabled ? 'usa-file-input usa-file-input--disabled' : 'usa-file-input'}>
        <div className={file ? 'usa-file-input__target has-file' : 'usa-file-input__target'}>
          {file ? (
            <>
              <div className="usa-file-input__preview-heading">
                Selected file <span className="usa-file-input__choose">Change file</span>
              </div>
              <div className="usa-file-input__preview" aria-hidden="true">
                {file.name}
              </div>
            </>
          ) : (
            <div className="usa-file-input__instructions" aria-hidden="true">
              <span className="usa-file-input__drag-text">Drag file here or </span>
              <span className="usa-file-input__choose">choose from folder</span>
            </div>
          )}
          <div className="usa-file-input__box" />
          <input
            {...f.attrs}
            type="file"
            accept={props.field.accept}
            className="usa-file-input__input"
            onChange={(event) => f.change(event.target.files?.[0] ?? null)}
          />
        </div>
      </div>
    </Shell>
  );
}
