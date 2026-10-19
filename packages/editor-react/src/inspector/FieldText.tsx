import { setFieldProp, type BuilderQuestion } from '@formhaus/builder';
import { takesPlaceholder } from '../canvas/placeholder';
import { Field, Input } from '../ui';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';

interface Props {
  field: BuilderQuestion;
  actions: EditorActions;
  readOnly: boolean;
}

export function FieldText({ field, actions, readOnly }: Props) {
  const text = (prop: 'helperText' | 'placeholder', label: string, placeholder: string) => (
    <Field label={label}>
      <Input
        value={field.extra[prop] ?? ''}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(event) => {
          actions.edit((form) => {
            setFieldProp(form, field.uid, prop, event.target.value);
          }, `${field.uid}:${prop}`);
        }}
      />
    </Field>
  );
  return (
    <div className={styles.pair}>
      {text('helperText', 'Help text', 'Shown under the question')}
      {takesPlaceholder(field) && text('placeholder', 'Placeholder', field.type === 'select' ? 'Choose…' : 'Shown in the empty box')}
    </div>
  );
}
