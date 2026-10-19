import { setFieldProp, type BuilderQuestion } from '@formhaus/builder';
import { SegmentedControl } from '../ui';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';

const OPTIONS = ['auto', '1', '2', '3', '4'].map((value) => ({ value, label: value === 'auto' ? 'Auto' : value }));

export function PerRow({ field, actions }: { field: BuilderQuestion; actions: EditorActions }) {
  return (
    <div className={styles.control}>
      <span className={styles.controlLabel}>Per row</span>
      <SegmentedControl
        label="Per row"
        options={OPTIONS}
        value={String(field.extra.columns ?? 'auto')}
        onValueChange={(value) => {
          actions.edit((form) => {
            setFieldProp(form, field.uid, 'columns', value === 'auto' ? undefined : Number(value));
          });
        }}
      />
    </div>
  );
}
