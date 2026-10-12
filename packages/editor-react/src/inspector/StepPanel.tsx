import { DEFAULT_BACK, DEFAULT_NEXT, setStepLabels, type BuilderPage } from '@formhaus/builder';
import { Field, Input, Text } from '../ui';
import { useReadOnly } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import { LogicSection } from '../logic/LogicSection';
import { StepFlow } from '../logic/StepFlow';
import styles from './Inspector.module.css';

export function StepPanel({ step, actions }: { step: BuilderPage; actions: EditorActions }) {
  const readOnly = useReadOnly();
  const label = (name: 'nextLabel' | 'backLabel', value: string) => {
    actions.edit((form) => {
      setStepLabels(form, step.uid, { [name]: value });
    }, `${step.uid}:${name}`);
  };
  return (
    <div className={styles.panel} role="group" aria-label="Step settings">
      <Field label="Continue button">
        <Input
          value={step.nextLabel}
          placeholder={DEFAULT_NEXT}
          readOnly={readOnly}
          onChange={(event) => {
            label('nextLabel', event.target.value);
          }}
        />
      </Field>
      <Field label="Back button">
        <Input
          value={step.backLabel}
          placeholder={DEFAULT_BACK}
          readOnly={readOnly}
          onChange={(event) => {
            label('backLabel', event.target.value);
          }}
        />
      </Field>
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
