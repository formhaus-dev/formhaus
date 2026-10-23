import type { FieldComponentProps } from '@formhaus/react';
import { HStack, SegmentGroup, Text } from '@chakra-ui/react';
import { GroupShell, pick, scalePoints } from './shared';

export function ScaleField(props: FieldComponentProps) {
  const { id, field, value, disabled, loading } = props;
  const points = scalePoints(field);
  const anchor = (point?: number) => field.options?.find((option) => option.value === String(point))?.label;
  const select = pick(props);

  return (
    <GroupShell props={props}>
      <SegmentGroup.Root
        name={field.key}
        ids={{ itemHiddenInput: (point) => (point === String(points[0]) ? `${id}` : `${id}-${point}`) }}
        width="full"
        disabled={disabled || loading}
        value={typeof value === 'number' ? String(value) : null}
        onValueChange={(details) => details.value !== null && select(Number(details.value))}
      >
        <SegmentGroup.Indicator />
        <SegmentGroup.Items items={points.map(String)} flex="1" justifyContent="center" />
      </SegmentGroup.Root>
      {(anchor(points[0]) || anchor(points.at(-1))) && (
        <HStack justify="space-between">
          <Text textStyle="xs" color="fg.muted">
            {anchor(points[0])}
          </Text>
          <Text textStyle="xs" color="fg.muted">
            {anchor(points.at(-1))}
          </Text>
        </HStack>
      )}
    </GroupShell>
  );
}
