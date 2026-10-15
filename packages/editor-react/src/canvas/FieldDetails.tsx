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
  const text = field.extra.helperText ?? '';
  if (!text && (!selected || readOnly)) return null;
  return (
    <InlineText
      value={text}
      label="Help text"
      placeholder="Help text"
      size="sm"
      tone="muted"
      multiline
      ring
      readOnly={readOnly}
      rowClassName={styles.help}
      onValueChange={(value) => {
        actions.edit((form) => {
          setFieldProp(form, field.uid, 'helperText', value);
        }, `${field.uid}:helperText`);
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

export function DefaultValueInput({ field, actions, readOnly }: Props) {
  return (
    <input
      className={cx(preview.box, preview.editable)}
      aria-label="Default value"
      value={typeof field.extra.defaultValue === 'string' ? field.extra.defaultValue : ''}
      placeholder="Default value (optional)"
      readOnly={readOnly}
      onChange={(event) => {
        actions.edit((form) => {
          setFieldProp(form, field.uid, 'defaultValue', event.target.value);
        }, `${field.uid}:defaultValue`);
      }}
    />
  );
}
