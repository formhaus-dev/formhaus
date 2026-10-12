import { hasCustomRoutes, setStepProp, type BuilderPage } from '@formhaus/builder';
import { Field, Input, Select, Switch, Text } from '../ui';
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
  const noContinue = step.extra.next === false;
  const skip = step.extra.skip;
  return (
    <section className={styles.section} aria-label="Flow">
      <span className={styles.title}>Flow</span>
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
      <Switch
        label="Allow skipping"
        checked={!!skip}
        disabled={readOnly || last || noContinue}
        onCheckedChange={(next) => {
          actions.edit((draft) => {
            setStepProp(draft, step.uid, 'skip', next ? { label: 'Skip' } : undefined);
          });
        }}
      />
      {(last || noContinue) && (
        <Text size="xs" tone="muted">
          {last ? 'The last step cannot be skipped.' : 'A step without a Continue button cannot be skipped.'}
        </Text>
      )}
      {skip && (
        <Field label="Skip button">
          <Input
            value={skip.label}
            readOnly={readOnly}
            onChange={(event) => {
              const label = event.target.value;
              actions.edit((draft) => {
                setStepProp(draft, step.uid, 'skip', { ...skip, label });
              }, `${step.uid}:skip`);
            }}
          />
        </Field>
      )}
    </section>
  );
}
