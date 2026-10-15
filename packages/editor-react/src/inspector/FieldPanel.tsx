import { canBranch, hasOptions, setFieldProp, setRequired, type BuilderQuestion } from '@formhaus/builder';
import type { FormField, FormGroup } from '@formhaus/core';
import { Field, Input, SegmentedControl, Switch } from '../ui';
import { LogicSection } from '../logic/LogicSection';
import { useReadOnly } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';
import { ResponseKey } from './ResponseKey';

function GroupSettings({ field, actions, readOnly }: { field: BuilderQuestion; actions: EditorActions; readOnly: boolean }) {
  const extra = field.extra as Partial<FormGroup>;
  const text = (prop: 'itemLabel' | 'addLabel', label: string, placeholder: string) => (
    <Field label={label}>
      <Input
        value={extra[prop] ?? ''}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(event) => {
          actions.edit((form) => {
            setFieldProp(form, field.uid, prop as keyof FormField, event.target.value);
          }, `${field.uid}:${prop}`);
        }}
      />
    </Field>
  );
  const count = (rule: 'minLength' | 'maxLength', label: string) => (
    <Field label={label}>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        max={100}
        value={field.extra.validation?.[rule] ?? ''}
        readOnly={readOnly}
        onChange={(event) => {
          const value = Number.parseInt(event.target.value, 10);
          const { [rule]: _old, ...rules } = field.extra.validation ?? {};
          actions.edit((form) => {
            setFieldProp(
              form,
              field.uid,
              'validation',
              Number.isNaN(value) ? (Object.keys(rules).length ? rules : undefined) : { ...rules, [rule]: value },
            );
          }, `${field.uid}:${rule}`);
        }}
      />
    </Field>
  );
  return (
    <>
      {text('itemLabel', 'Item title', `${field.label.trim() || 'Item'} {index}`)}
      {text('addLabel', 'Add button', 'Add')}
      {count('minLength', 'Fewest items')}
      {count('maxLength', 'Most items')}
    </>
  );
}

export function FieldPanel({ field, actions }: { field: BuilderQuestion; actions: EditorActions }) {
  const readOnly = useReadOnly();
  return (
    <div className={styles.panel} role="group" aria-label="Field settings">
      {field.type !== 'section' && (
        <Switch
          className={styles.toggle}
          label={field.type === 'group' ? 'At least one item' : 'Required'}
          checked={field.required}
          disabled={readOnly}
          onCheckedChange={(next) => {
            actions.edit((form) => {
              setRequired(form, field.uid, next);
            });
          }}
        />
      )}
      {field.type === 'group' && <GroupSettings field={field} actions={actions} readOnly={readOnly} />}
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
