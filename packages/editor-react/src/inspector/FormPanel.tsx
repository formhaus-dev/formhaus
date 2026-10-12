import { setSubmitLabel } from '@formhaus/builder';
import { Field, Input } from '../ui';
import { useForm, useReadOnly } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';

export function FormPanel({ actions }: { actions: EditorActions }) {
  const form = useForm();
  const readOnly = useReadOnly();
  return (
    <div className={styles.panel}>
      <Field label="Submit button" hint="The button at the end of the form.">
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
    </div>
  );
}
