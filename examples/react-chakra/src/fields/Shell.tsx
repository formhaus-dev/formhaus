import type { FieldProps } from '@formhaus/react';
import type { ControlShellProps } from '@formhaus/react/controls';
import { Field, Fieldset, HStack, Text } from '@chakra-ui/react';
import { createContext } from 'react';

export const Inline = createContext(false);

export const labelId = (f: FieldProps) => `${f.id}-label`;

export const RequiredMark = ({ f }: { f: FieldProps }) =>
  f.required && (
    <Text as="span" color="fg.error" ms="1" aria-hidden>
      *
    </Text>
  );

export function Shell({ kind, field, f, rootProps, anchors, children }: ControlShellProps) {
  if (kind !== 'group')
    return (
      <Field.Root
        {...rootProps}
        id={f.id}
        ids={{ label: labelId(f), helperText: f.helperId, errorText: f.errorId }}
        invalid={f.invalid}
        required={f.required}
        disabled={f.disabled}
      >
        {kind === 'input' && (
          <Field.Label>
            {f.label}
            <Field.RequiredIndicator />
          </Field.Label>
        )}
        {children}
        {f.helperText && <Field.HelperText>{f.helperText}</Field.HelperText>}
        <Field.ErrorText>{f.error}</Field.ErrorText>
      </Field.Root>
    );
  return (
    <Fieldset.Root {...rootProps} invalid={f.invalid} size="sm">
      <Fieldset.Legend id={labelId(f)} fontSize="sm" fontWeight="medium">
        {f.label}
        <RequiredMark f={f} />
      </Fieldset.Legend>
      {f.helperText && (
        <Fieldset.HelperText id={f.helperId} textStyle="xs">
          {f.helperText}
        </Fieldset.HelperText>
      )}
      <Inline value={field.layout === 'inline'}>{children}</Inline>
      {anchors.some(Boolean) && (
        <HStack justify="space-between">
          {anchors.map((anchor, index) => (
            <Text key={index} textStyle="xs" color="fg.muted">
              {anchor?.label}
            </Text>
          ))}
        </HStack>
      )}
      <Fieldset.ErrorText id={f.errorId} textStyle="xs">
        {f.error}
      </Fieldset.ErrorText>
    </Fieldset.Root>
  );
}
