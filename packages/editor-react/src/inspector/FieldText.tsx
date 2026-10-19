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
  if (!takesPlaceholder(field)) return null;
  return (
    <div className={styles.pair}>
      <Field label="Placeholder">
        <Input
          value={field.extra.placeholder ?? ''}
          placeholder={field.type === 'select' ? 'Choose…' : 'Shown in the empty box'}
          readOnly={readOnly}
          onChange={(event) => {
            actions.edit((form) => {
              setFieldProp(form, field.uid, 'placeholder', event.target.value);
            }, `${field.uid}:placeholder`);
          }}
        />
      </Field>
    </div>
  );
}
