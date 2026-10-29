import { addFiles, fileEntries, isFileList, removeFile } from '@formhaus/core/fields';
import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { Button, FileUploaderItem, FormGroup, Stack } from '@carbon/react';
import { Upload } from '@carbon/icons-react';
import { useRef } from 'react';
import { GroupMessage } from './GroupMessage';
import { label } from './labels';

export function FileField(props: FieldComponentProps) {
  const f = fieldProps(props);
  const { field, value } = props;
  const input = useRef<HTMLInputElement>(null);
  const list = isFileList(field);

  return (
    <FormGroup legendText={label(f)} invalid={f.invalid} data-fh="field">
      <Stack gap={3}>
        <GroupMessage id={f.helperId} helper={f.helperText} />
        <div>
          <Button
            id={f.id}
            kind="tertiary"
            size="md"
            renderIcon={Upload}
            disabled={f.disabled}
            aria-describedby={f.describedBy}
            onClick={() => input.current?.click()}
            onBlur={f.blur}
            onFocus={f.focus}
          >
            {f.placeholder ?? (list ? 'Add files' : 'Choose a file')}
          </Button>
          <input
            ref={input}
            type="file"
            name={f.name}
            accept={field.accept}
            multiple={list}
            hidden
            onChange={(event) => {
              const picked = Array.from(event.currentTarget.files ?? []);
              event.currentTarget.value = '';
              if (!list) f.change(picked[0] ?? null);
              else if (picked.length) f.change(addFiles(value, picked));
            }}
          />
        </div>
        {fileEntries(value).map(({ index, name }) => (
          <FileUploaderItem
            key={index}
            name={name}
            status="edit"
            iconDescription="Remove"
            disabled={f.disabled}
            onDelete={() => f.change(list ? removeFile(value, index) : null)}
          />
        ))}
      </Stack>
      <GroupMessage id={f.errorId} error={f.error} />
    </FormGroup>
  );
}
