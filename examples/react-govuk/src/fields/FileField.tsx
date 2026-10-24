import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { Shell } from './Shell';

export function FileField(props: FieldComponentProps) {
  const f = fieldProps(props);
  return (
    <Shell kind="input" field={props.field} f={f} rootProps={{ 'data-fh': 'field' }}>
      <input
        {...f.attrs}
        type="file"
        accept={props.field.accept}
        className={f.invalid ? 'govuk-file-upload govuk-file-upload--error' : 'govuk-file-upload'}
        onChange={(event) => f.change(event.target.files?.[0] ?? null)}
      />
    </Shell>
  );
}
