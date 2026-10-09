import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { inputProps } from './fieldProps';

export function FileField(props: FieldComponentProps) {
  const { field, error, onChange } = props;

  return (
    <FieldShell field={field} error={error}>
      <input
        {...inputProps(props)}
        type="file"
        className="fh-field__input fh-field__input--file"
        accept={field.accept}
        onChange={(e) => {
          const files = e.target.files;
          onChange(files && files.length > 0 ? files[0] : null);
        }}
      />
    </FieldShell>
  );
}
