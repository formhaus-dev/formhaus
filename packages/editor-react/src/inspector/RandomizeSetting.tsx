import { setRandomize, type BuilderQuestion } from '@formhaus/builder';
import { useId } from 'react';
import { Stack, Text } from '../ui';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';
import { SettingSwitch } from './SettingSwitch';

export function RandomizeSetting({ field, actions, readOnly }: { field: BuilderQuestion; actions: EditorActions; readOnly: boolean }) {
  const hint = useId();
  const on = field.extra.randomize ?? false;
  return (
    <Stack gap="1" align="start" className={styles.wide}>
      <SettingSwitch
        label="Randomize option order"
        checked={on}
        actions={actions}
        readOnly={readOnly}
        aria-describedby={on ? hint : undefined}
        onChange={(form, next) => {
          setRandomize(form, field.uid, next);
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
