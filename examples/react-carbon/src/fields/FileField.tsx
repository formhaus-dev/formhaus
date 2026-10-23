import type { FieldComponentProps } from '@formhaus/react';
import { Button, FileUploaderItem, FormGroup, Stack } from '@carbon/react';
import { Upload } from '@carbon/icons-react';
import { useRef } from 'react';
import { groupProps, inputProps } from './shared';
import { GroupMessage } from './GroupMessage';

export function FileField(props: FieldComponentProps) {
  const { field, value, onChange } = props;
  const { id, disabled, onBlur, onFocus } = inputProps(props);
  const input = useRef<HTMLInputElement>(null);

  return (
    <FormGroup {...groupProps(props)}>
      <Stack gap={3}>
        <div>
          <Button
            id={id}
            kind="tertiary"
            size="md"
            renderIcon={Upload}
            disabled={disabled}
            onClick={() => input.current?.click()}
            onBlur={onBlur}
            onFocus={onFocus}
          >
            {field.placeholder ?? 'Choose a file'}
          </Button>
          <input
            ref={input}
            type="file"
            name={field.key}
            accept={field.accept}
            hidden
            onChange={(event) => onChange(event.currentTarget.files?.[0] ?? null)}
          />
        </div>
        {value instanceof File && <FileUploaderItem name={value.name} status="edit" onDelete={() => onChange(null)} />}
      </Stack>
      <GroupMessage error={props.error} helper={props.field.helperText} />
    </FormGroup>
  );
}
