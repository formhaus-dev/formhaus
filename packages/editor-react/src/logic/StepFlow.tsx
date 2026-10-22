import { hasCustomRoutes, type BuilderPage } from '@formhaus/builder';
import { SettingsSection } from '../inspector/SettingsSection';
import { Field, Select, Text } from '../ui';
import { useForm, useReadOnly } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import styles from './Logic.module.css';
import { setNext, targetsAfter } from './targets';

export function StepFlow({ step, actions }: { step: BuilderPage; actions: EditorActions }) {
  const form = useForm();
  const readOnly = useReadOnly();
  const targets = targetsAfter(form, step.uid);
  const custom = hasCustomRoutes(form, step.uid);
  const last = !targets.length;
  return (
    <SettingsSection title="Flow">
      <div className={styles.section}>
        {custom ? (
          <Text size="sm" tone="muted">
            This step uses custom routes.
          </Text>
        ) : (
          !last && (
            <Field label="After this step">
              <Select
                value={step.next ?? ''}
                disabled={readOnly}
                options={targets}
                onChange={(event) => {
                  const target = event.target.value;
                  actions.edit((draft) => {
                    setNext(draft, step.uid, target);
                  });
                }}
              />
            </Field>
          )
        )}
      </div>
    </SettingsSection>
  );
}
