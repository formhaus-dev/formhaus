import { DEFAULT_BACK, DEFAULT_NEXT, setStepLabels, setStepProp, setSubmitLabel, type BuilderPage } from '@formhaus/builder';
import settings from '../inspector/Inspector.module.css';
import { useForm, useReadOnly } from '../store/hooks';
import { Field, Input, Switch } from '../ui';
import type { EditorActions } from '../useEditorActions';
import styles from './ButtonsCard.module.css';
import card from './FieldCard.module.css';

interface Props {
  step: BuilderPage | null;
  first: boolean;
  last: boolean;
  actions: EditorActions;
}

export function ButtonsCard({ step, first, last, actions }: Props) {
  const form = useForm();
  const readOnly = useReadOnly();
  const label = (name: 'nextLabel' | 'backLabel', value: string) => {
    if (!step) return;
    actions.edit((draft) => {
      setStepLabels(draft, step.uid, { [name]: value });
    }, `${step.uid}:${name}`);
  };
  const skip = step?.extra.skip;
  const continues = !!step && !last && step.extra.next !== false;
  const name = step ? step.title.trim() || 'this step' : 'the form';
  const back = !!step && !first;
  const span = [continues, last, back].filter(Boolean).length === 1 ? settings.wide : undefined;
  return (
    <div className={card.card} role="group" aria-label={`Buttons for ${name}`}>
      <div className={card.body}>
        <span className={styles.title}>Buttons</span>
        <div className={`${settings.settings} ${settings.plain}`}>
          <div className={settings.panel}>
            {continues && (
              <Field label="Continue button" className={span}>
                <Input
                  value={step.nextLabel}
                  placeholder={DEFAULT_NEXT}
                  readOnly={readOnly}
                  onChange={(event) => {
                    label('nextLabel', event.target.value);
                  }}
                />
              </Field>
            )}
            {last && (
              <Field label="Submit button" className={span}>
                <Input
                  value={form.submit}
                  placeholder="Submit"
                  readOnly={readOnly}
                  onChange={(event) => {
                    actions.edit((draft) => {
                      setSubmitLabel(draft, event.target.value);
                    }, 'form:submit');
                  }}
                />
              </Field>
            )}
            {back && (
              <Field label="Back button" className={span}>
                <Input
                  value={step.backLabel}
                  placeholder={DEFAULT_BACK}
                  readOnly={readOnly}
                  onChange={(event) => {
                    label('backLabel', event.target.value);
                  }}
                />
              </Field>
            )}
            {continues && (
              <div className={styles.skip}>
                <Switch
                  label="Allow skipping"
                  checked={!!skip}
                  disabled={readOnly}
                  onCheckedChange={(next) => {
                    actions.edit((draft) => {
                      setStepProp(draft, step.uid, 'skip', next ? { label: 'Skip' } : undefined);
                    });
                  }}
                />
                {skip && (
                  <Field label="Skip button">
                    <Input
                      value={skip.label}
                      readOnly={readOnly}
                      onChange={(event) => {
                        const text = event.target.value;
                        actions.edit((draft) => {
                          setStepProp(draft, step.uid, 'skip', { ...skip, label: text });
                        }, `${step.uid}:skip`);
                      }}
                    />
                  </Field>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
