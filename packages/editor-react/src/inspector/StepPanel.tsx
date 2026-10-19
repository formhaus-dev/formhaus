import { isPage, stepFields, type BuilderPage } from '@formhaus/builder';
import { DoorOpen } from 'lucide-react';
import { Button, Text } from '../ui';
import { useForm, useReadOnly } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import { LogicSection } from '../logic/LogicSection';
import { StepFlow } from '../logic/StepFlow';
import styles from './Inspector.module.css';

export function StepPanel({ step, actions }: { step: BuilderPage; actions: EditorActions }) {
  const form = useForm();
  const readOnly = useReadOnly();
  const empty = stepFields(form, step.uid).length === 0;
  const first = form.blocks.find(isPage) === step;
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
      {first && !empty && !readOnly && (
        <div className={styles.group}>
          <span className={styles.controlLabel}>Welcome screen</span>
          <Text size="sm" tone="muted">
            A first step with a title, a short description and a Start button.
          </Text>
          <Button
            variant="secondary"
            icon={<DoorOpen aria-hidden />}
            onClick={() => {
              actions.addWelcome();
            }}
          >
            Add welcome screen
          </Button>
        </div>
      )}
    </div>
  );
}
