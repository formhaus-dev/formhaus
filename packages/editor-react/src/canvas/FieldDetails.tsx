import { setFieldProp, type BuilderQuestion } from '@formhaus/builder';
import { InlineText } from '../ui';
import { cx } from '../ui/lib/cx';
import type { EditorActions } from '../useEditorActions';
import styles from './FieldCard.module.css';
import preview from './FieldPreview.module.css';

interface Props {
  field: BuilderQuestion;
  actions: EditorActions;
  readOnly: boolean;
}

export function HelpText({ field, actions, readOnly, selected }: Props & { selected: boolean }) {
  const prop = (field.type === 'section' ? 'description' : 'helperText') as 'helperText';
  const name = field.type === 'section' ? 'Description' : 'Help text';
  const text = field.extra[prop] ?? '';
  if (!text && (!selected || readOnly)) return null;
  return (
    <InlineText
      value={text}
      label={name}
      placeholder={name}
      size="sm"
      tone="muted"
      multiline
      ring
      readOnly={readOnly}
      rowClassName={styles.help}
      onValueChange={(value) => {
        actions.edit((form) => {
          setFieldProp(form, field.uid, prop, value);
        }, `${field.uid}:${prop}`);
      }}
    />
  );
}

export function PlaceholderInput({ field, actions, readOnly }: Props) {
  return (
    <input
      className={cx(preview.box, preview.editable, field.type === 'textarea' && preview.area)}
      aria-label="Placeholder"
      value={field.extra.placeholder ?? ''}
      placeholder={field.type === 'select' ? 'Choose… (placeholder)' : 'Placeholder (optional)'}
      readOnly={readOnly}
      onChange={(event) => {
        actions.edit((form) => {
          setFieldProp(form, field.uid, 'placeholder', event.target.value);
        }, `${field.uid}:placeholder`);
      }}
    />
  );
}
