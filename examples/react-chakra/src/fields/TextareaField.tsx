import type { FieldComponentProps } from '@formhaus/react';
import { Textarea } from '@chakra-ui/react';
import { FieldShell } from './shared';

export function TextareaField(props: FieldComponentProps) {
  const { field, value, onChange, onBlur, onFocus } = props;

  return (
    <FieldShell props={props}>
      <Textarea
        name={field.key}
        rows={field.rows ?? 3}
        autoresize
        value={(value as string) ?? ''}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </FieldShell>
  );
}
