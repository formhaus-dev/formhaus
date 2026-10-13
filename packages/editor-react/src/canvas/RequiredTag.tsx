import { setRequired, type BuilderQuestion } from '@formhaus/builder';
import { Tooltip } from '../ui';
import { cx } from '../ui/lib/cx';
import type { EditorActions } from '../useEditorActions';
import styles from './FieldCard.module.css';

interface Props {
  field: BuilderQuestion;
  actions: EditorActions;
  editable: boolean;
  reserve: boolean;
}

export function RequiredTag({ field, actions, editable, reserve }: Props) {
  if (!editable && field.required) return <span className={styles.requiredTag}>Required</span>;
  if (!editable)
    return reserve ? (
      <span className={cx(styles.requiredTag, styles.ghost)} aria-hidden>
        Optional
      </span>
    ) : null;
  return (
    <Tooltip content={field.required ? 'Click to make optional' : 'Click to make required'}>
      <button
        type="button"
        className={cx(styles.requiredTag, styles.toggle, !field.required && styles.optional)}
        aria-label={field.required ? 'Required, click to make optional' : 'Optional, click to make required'}
        onClick={(event) => {
          event.stopPropagation();
          actions.edit((form) => {
            setRequired(form, field.uid, !field.required);
          });
        }}
      >
        {field.required ? 'Required' : 'Optional'}
      </button>
    </Tooltip>
  );
}
