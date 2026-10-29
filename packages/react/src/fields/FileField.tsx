import { isFileList } from '@formhaus/core/fields';
import type { FieldComponentProps } from '../types';
import { FieldShell } from './FieldShell';
import { FileList } from './FileList';
import { fieldId, inputProps } from './fieldProps';

export function FileField(props: FieldComponentProps) {
  const { field, error, onChange } = props;

  return (
    <FieldShell id={fieldId(props)} field={field} error={error}>
      {isFileList(field) ? (
        <FileList {...props} />
      ) : (
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
      )}
    </FieldShell>
  );
}
