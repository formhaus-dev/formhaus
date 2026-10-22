import { setRandomize, type BuilderQuestion } from '@formhaus/builder';
import { useId } from 'react';
import { Stack, Switch, Text } from '../ui';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';

export function RandomizeSetting({ field, actions, readOnly }: { field: BuilderQuestion; actions: EditorActions; readOnly: boolean }) {
  const hint = useId();
  const on = field.extra.randomize ?? false;
  return (
    <Stack gap="1" align="start" className={styles.wide}>
      <Switch
        label="Randomize option order"
        checked={on}
        disabled={readOnly}
        aria-describedby={on ? hint : undefined}
        onCheckedChange={(next) => {
          actions.edit((form) => {
            setRandomize(form, field.uid, next);
          });
        }}
      />
      {on && (
        <Text as="p" id={hint} size="xs" tone="muted">
          Pin to keep in place
        </Text>
      )}
    </Stack>
  );
}
