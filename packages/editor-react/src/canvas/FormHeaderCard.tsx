import { setFormProp, setFormTitle } from '@formhaus/builder';
import { useRef } from 'react';
import { InlineText } from '../ui';
import { useEditorStore } from '../store/context';
import { useForm, useIsSelected, useReadOnly } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import styles from './Canvas.module.css';

export function FormHeaderCard({ actions }: { actions: EditorActions }) {
  const form = useForm();
  const store = useEditorStore();
  const selected = useIsSelected({ kind: 'form' });
  const readOnly = useReadOnly();
  const title = useRef<HTMLTextAreaElement>(null);

  const select = () => {
    if (!selected) store.select({ kind: 'form' });
  };
  return (
    <div
      className={styles.formHeader}
      role="group"
      aria-label="Form title and description"
      onClick={(event) => {
        select();
        if (event.target === event.currentTarget) title.current?.focus();
      }}
    >
      <InlineText
        ref={title}
        value={form.title}
        label="Form title"
        placeholder="Form title"
        size="xl"
        ring
        readOnly={readOnly}
        onFocus={select}
        onValueChange={(value) => {
          actions.edit((draft) => {
            setFormTitle(draft, value);
          }, 'form:title');
        }}
      />
      <InlineText
        value={form.extra.description ?? ''}
        label="Form description"
        placeholder="Description"
        tone="muted"
        multiline
        ring
        readOnly={readOnly}
        onFocus={select}
        onValueChange={(value) => {
          actions.edit((draft) => {
            setFormProp(draft, 'description', value);
          }, 'form:description');
        }}
      />
    </div>
  );
}
