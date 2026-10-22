import { setOptionPinned, type BuilderOption } from '@formhaus/builder';
import { Pin } from 'lucide-react';
import { cx, IconButton } from '../ui';
import type { EditorActions } from '../useEditorActions';
import styles from './OptionsEditor.module.css';

interface Props {
  fieldUid: string;
  option: BuilderOption;
  name: string;
  actions: EditorActions;
  readOnly: boolean;
}

export function PinOption({ fieldUid, option, name, actions, readOnly }: Props) {
  if (option.extra?.exclusive)
    return (
      <IconButton
        label={`“${name}” is never shuffled`}
        tooltip="Never shuffled"
        icon={<Pin aria-hidden />}
        aria-disabled
        className={styles.pin}
      />
    );
  const pinned = option.extra?.pinned ?? false;
  return (
    <IconButton
      label={pinned ? `Unpin “${name}”` : `Pin “${name}” in place`}
      icon={<Pin aria-hidden />}
      disabled={readOnly}
      className={cx(styles.pin, pinned && styles.pinned)}
      onClick={() => {
        actions.edit((form) => {
          setOptionPinned(form, fieldUid, option.uid, !pinned);
        });
      }}
    />
  );
}
