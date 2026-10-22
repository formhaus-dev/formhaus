import type { BuilderQuestion } from '@formhaus/builder';
import { LogicSection } from '../logic/LogicSection';
import { useReadOnly } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';
import { AdvancedSettings } from './AdvancedSettings';
import { AnswerSettings } from './AnswerSettings';

export function FieldPanel({ field, actions }: { field: BuilderQuestion; actions: EditorActions }) {
  const readOnly = useReadOnly();
  return (
    <div className={styles.sections} role="group" aria-label="Field settings">
      <AnswerSettings field={field} actions={actions} readOnly={readOnly} />
      <LogicSection block={field} actions={actions} />
      <AdvancedSettings field={field} actions={actions} readOnly={readOnly} />
    </div>
  );
}
