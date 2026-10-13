import { inferType, removeField, setFieldType, setLabel, splitLines, type BuilderQuestion } from '@formhaus/builder';
import { useState, type ClipboardEvent, type KeyboardEvent, type Ref } from 'react';
import { InlineText } from '../ui';
import { useEditorStore } from '../store/context';
import type { EditorActions } from '../useEditorActions';
import styles from './FieldCard.module.css';
import { FieldPalette } from './FieldPalette';
import { focusCard, neighbourCard, useFocusRequests } from './focus';

interface Props {
  field: BuilderQuestion;
  actions: EditorActions;
  readOnly: boolean;
  inputRef: Ref<HTMLTextAreaElement>;
  onSelect: () => void;
  onAddBelow: () => void;
  onCardKey: (event: KeyboardEvent<HTMLElement>, editing: boolean) => void;
}

export function FieldLabel({ field, actions, readOnly, inputRef, onSelect, onAddBelow, onCardKey }: Props) {
  const store = useEditorStore();
  const focus = useFocusRequests();
  const [slash, setSlash] = useState(false);
  const { uid } = field;

  function onLabel(value: string) {
    if (value === '/' && !field.label) {
      setSlash(true);
      return;
    }
    actions.edit((form) => {
      setLabel(form, uid, value);
    }, `${uid}:label`);
  }

  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const lines = splitLines(event.clipboardData.getData('text'));
    if (lines.length < 2 || field.label) return;
    event.preventDefault();
    const [first = '', ...rest] = lines;
    onLabel(first);
    let after = uid;
    for (const line of rest) after = actions.addField({ after }, { label: line, type: inferType(line) ?? 'text' }) ?? after;
  }

  const input = (
    <InlineText
      ref={inputRef}
      data-focus="label"
      value={field.label}
      label="Field label"
      placeholder="Question"
      size="lg"
      ring
      readOnly={readOnly}
      rowClassName={styles.label}
      onFocus={onSelect}
      onValueChange={onLabel}
      onEnter={onAddBelow}
      onEscape={() => {
        focusCard(uid);
      }}
      onPaste={onPaste}
      onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Backspace' && !field.label && !readOnly) {
          const previous = neighbourCard(event.currentTarget.closest<HTMLElement>('[data-card]') ?? event.currentTarget, -1);
          if (previous && store.update((form) => removeField(form, uid))) {
            event.preventDefault();
            focusCard(previous.dataset.card ?? '', 'label');
            return;
          }
        }
        onCardKey(event, true);
      }}
    />
  );
  if (!slash) return input;
  return (
    <FieldPalette
      open
      anchor={<div className={styles.label}>{input}</div>}
      onOpenChange={(open) => {
        if (!open) setSlash(false);
      }}
      onPick={(type) => {
        actions.edit((form) => {
          setFieldType(form, uid, type);
        });
        focus.request(uid, 'label');
      }}
    />
  );
}
