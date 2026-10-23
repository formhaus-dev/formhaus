import type { FieldComponentProps } from '@formhaus/react';
import { Input, Rating } from '@mantine/core';
import { inputProps, pick, scalePoints } from './shared';

export function RatingField(props: FieldComponentProps) {
  const { id, field, value, error } = props;
  const { disabled, withAsterisk, onBlur, onFocus } = inputProps(props);

  return (
    <Input.Wrapper label={field.label} description={field.helperText} error={error} withAsterisk={withAsterisk} labelElement="div">
      <Rating
        id={id}
        name={field.key}
        mt="xs"
        mb={4}
        size="lg"
        count={scalePoints(field).length}
        readOnly={disabled}
        value={typeof value === 'number' ? value : 0}
        onChange={pick(props)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </Input.Wrapper>
  );
}
