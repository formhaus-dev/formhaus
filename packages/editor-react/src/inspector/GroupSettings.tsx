import { setFieldProp, setRequired, type BuilderQuestion } from '@formhaus/builder';
import type { FormField, FormGroup } from '@formhaus/core';
import { Field, Input } from '../ui';
import type { EditorActions } from '../useEditorActions';
import { SettingSwitch } from './SettingSwitch';

interface Props {
  field: BuilderQuestion;
  actions: EditorActions;
  readOnly: boolean;
}

export function GroupSettings({ field, actions, readOnly }: Props) {
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
      <SettingSwitch
        label="At least one item"
        checked={field.required}
        actions={actions}
        readOnly={readOnly}
        onChange={(form, next) => {
          setRequired(form, field.uid, next);
        }}
      />
      {text('itemLabel', 'Item title', `${field.label.trim() || 'Item'} {index}`)}
      {text('addLabel', 'Add button', 'Add')}
      {count('minLength', 'Fewest items')}
      {count('maxLength', 'Most items')}
    </>
  );
}
