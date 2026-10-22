import { setRequired, type BuilderQuestion } from '@formhaus/builder';
import { SegmentedControl } from '../ui';
import { cx } from '../ui/lib/cx';
import type { EditorActions } from '../useEditorActions';
import styles from './FieldCard.module.css';
import tag from './RequiredTag.module.css';

interface Props {
  field: BuilderQuestion;
  actions: EditorActions;
  editable: boolean;
  reserve: boolean;
}

const STATES = [
  { value: 'optional', label: 'Optional' },
  { value: 'required', label: 'Required' },
];

export function RequiredTag({ field, actions, editable, reserve }: Props) {
  if (!editable && field.required) return <span className={styles.requiredTag}>Required</span>;
  if (!editable)
    return reserve ? (
      <span className={cx(styles.requiredTag, styles.ghost)} aria-hidden>
        Optional
      </span>
    ) : null;
  return (
    <SegmentedControl
      label="Answer"
      className={tag.compact}
      options={STATES}
      value={field.required ? 'required' : 'optional'}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onValueChange={(value) => {
        actions.edit((form) => {
          setRequired(form, field.uid, value === 'required');
        });
      }}
    />
  );
}
