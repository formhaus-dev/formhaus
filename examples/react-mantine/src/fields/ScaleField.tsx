import type { FieldComponentProps } from '@formhaus/react';
import { Group, Input, SegmentedControl, Text } from '@mantine/core';
import { inputProps, pick, scalePoints } from './shared';

export function ScaleField(props: FieldComponentProps) {
  const { id, field, value, error } = props;
  const { disabled, withAsterisk } = inputProps(props);
  const points = scalePoints(field);
  const anchor = (point?: number) => field.options?.find((option) => option.value === String(point))?.label;
  const select = pick(props);

  return (
    <Input.Wrapper label={field.label} description={field.helperText} error={error} withAsterisk={withAsterisk} labelElement="div">
      <SegmentedControl
        id={id}
        name={field.key}
        fullWidth
        mt="xs"
        color="blue"
        withItemsBorders={false}
        disabled={disabled}
        aria-label={field.label}
        data={points.map(String)}
        value={typeof value === 'number' ? String(value) : ''}
        onChange={(next) => select(Number(next))}
      />
      {(anchor(points[0]) || anchor(points.at(-1))) && (
        <Group justify="space-between" mt={4}>
          <Text size="xs" c="dimmed">
            {anchor(points[0])}
          </Text>
          <Text size="xs" c="dimmed">
            {anchor(points.at(-1))}
          </Text>
        </Group>
      )}
    </Input.Wrapper>
  );
}
