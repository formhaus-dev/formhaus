import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import { Button, FileUploaderItem, FormGroup, Stack } from '@carbon/react';
import { Upload } from '@carbon/icons-react';
import { useRef } from 'react';
import { Texts } from './GroupMessage';
import { label } from './labels';

export function FileField(props: FieldComponentProps) {
  const f = fieldProps(props);
  const { field, value } = props;
  const input = useRef<HTMLInputElement>(null);

  return (
    <FormGroup legendText={label(f)} invalid={f.invalid} data-fh="field">
      <Stack gap={3}>
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
            {f.placeholder ?? 'Choose a file'}
          </Button>
          <input
            ref={input}
            type="file"
            name={f.name}
            accept={field.accept}
            hidden
            onChange={(event) => f.change(event.currentTarget.files?.[0] ?? null)}
          />
        </div>
        {value instanceof File && <FileUploaderItem name={value.name} status="edit" onDelete={() => f.change(null)} />}
      </Stack>
      <Texts id={f.id} helperText={f.helperText} error={f.error} />
    </FormGroup>
  );
}
