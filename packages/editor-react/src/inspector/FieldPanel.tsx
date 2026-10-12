import { canBranch, hasOptions, setFieldProp, setRequired, type BuilderQuestion } from '@formhaus/builder';
import { Field, Input, SegmentedControl, Switch } from '../ui';
import { LogicSection } from '../logic/LogicSection';
import { useReadOnly } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';
import { ResponseKey } from './ResponseKey';

export function FieldPanel({ field, actions }: { field: BuilderQuestion; actions: EditorActions }) {
  const readOnly = useReadOnly();
  return (
    <div className={styles.panel} role="group" aria-label="Field settings">
      <Switch
        className={styles.toggle}
        label="Required"
        checked={field.required}
        disabled={readOnly}
        onCheckedChange={(next) => {
          actions.edit((form) => {
            setRequired(form, field.uid, next);
          });
        }}
      />
      <LogicSection block={field} actions={actions} />
      {canBranch(field.type) && field.type === 'radio' && (
        <Switch
          className={styles.toggle}
          label="Go to the next step when picked"
          checked={field.extra.autoAdvance ?? false}
          disabled={readOnly}
          onCheckedChange={(next) => {
            actions.edit((form) => {
              setFieldProp(form, field.uid, 'autoAdvance', next || undefined);
            });
          }}
        />
      )}
      {hasOptions(field.type) && field.type !== 'select' && (
        <div className={styles.control}>
          <span className={styles.controlLabel}>Option layout</span>
          <SegmentedControl
            label="Option layout"
            options={[
              { value: 'stack', label: 'Stacked' },
              { value: 'inline', label: 'In a row' },
            ]}
            value={field.extra.layout ?? 'stack'}
            onValueChange={(value) => {
              actions.edit((form) => {
                setFieldProp(form, field.uid, 'layout', value === 'inline' ? 'inline' : undefined);
              });
            }}
          />
        </div>
      )}
      {field.type === 'textarea' && (
        <Field label="Rows">
          <Input
            type="number"
            inputMode="numeric"
            min={2}
            max={20}
            value={field.extra.rows ?? ''}
            readOnly={readOnly}
            onChange={(event) => {
              const rows = Number.parseInt(event.target.value, 10);
              actions.edit((form) => {
                setFieldProp(form, field.uid, 'rows', Number.isNaN(rows) ? undefined : rows);
              }, `${field.uid}:rows`);
            }}
          />
        </Field>
      )}
      <div className={styles.wide}>
        <ResponseKey field={field} actions={actions} readOnly={readOnly} />
      </div>
    </div>
  );
}
