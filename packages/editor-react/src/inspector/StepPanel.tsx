import type { BuilderPage } from '@formhaus/builder';
import { Text } from '../ui';
import type { EditorActions } from '../useEditorActions';
import { LogicSection } from '../logic/LogicSection';
import { StepFlow } from '../logic/StepFlow';
import styles from './Inspector.module.css';

export function StepPanel({ step, actions }: { step: BuilderPage; actions: EditorActions }) {
  return (
    <div className={styles.panel} role="group" aria-label="Step settings">
      <StepFlow step={step} actions={actions} />
      <div className={styles.wide}>
        <LogicSection block={step} actions={actions} />
      </div>
      <div className={styles.group}>
        <span className={styles.controlLabel}>Step id</span>
        <Text mono className={styles.keyValue}>
          {step.id}
        </Text>
        <Text size="sm" tone="muted">
          Used in routes and analytics.
        </Text>
      </div>
    </div>
  );
}
