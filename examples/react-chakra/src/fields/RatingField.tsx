import type { FieldComponentProps } from '@formhaus/react';
import { RatingGroup } from '@chakra-ui/react';
import { GroupShell, pick, scalePoints } from './shared';

export function RatingField(props: FieldComponentProps) {
  const { id, field, value, disabled, loading } = props;

  return (
    <GroupShell props={props}>
      <RatingGroup.Root
        name={field.key}
        ids={{ item: (index) => (index === '1' ? `${id}` : `${id}-${index}`) }}
        size="lg"
        colorPalette="orange"
        count={scalePoints(field).length}
        disabled={disabled || loading}
        value={typeof value === 'number' ? value : 0}
        onValueChange={(details) => pick(props)(details.value)}
      >
        <RatingGroup.HiddenInput />
        <RatingGroup.Control />
      </RatingGroup.Root>
    </GroupShell>
  );
}
