import type { FieldProps } from '@formhaus/react';
import { Input, type InputProps, InputGroup, Span, Textarea, type TextareaProps } from '@chakra-ui/react';

const count = (f: FieldProps) =>
  f.maxLength ? (
    <Span color="fg.muted" textStyle="xs">
      {f.text.length} / {f.maxLength}
    </Span>
  ) : undefined;

export function CountedInput({ f, ...props }: InputProps & { f: FieldProps }) {
  return (
    <InputGroup endElement={count(f)}>
      <Input {...props} />
    </InputGroup>
  );
}

export function CountedTextarea({ f, ...props }: TextareaProps & { f: FieldProps }) {
  return (
    <InputGroup endElement={count(f)} endElementProps={{ alignItems: 'flex-end', pb: '2' }}>
      <Textarea {...props} pe={f.maxLength ? '16' : undefined} />
    </InputGroup>
  );
}
