import { setRule, type BuilderQuestion } from '@formhaus/builder';
import { useEffect, useRef, useState } from 'react';
import { AddRow, Field, Input } from '../ui';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';
import { patternError } from './limits';

interface Props {
  field: BuilderQuestion;
  actions: EditorActions;
  readOnly: boolean;
}

export function PatternSettings({ field, actions, readOnly }: Props) {
  const rules = field.extra.validation ?? {};
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const pattern = draft ?? rules.pattern ?? '';
  const error = pattern ? patternError(pattern) : undefined;
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  if (!open && rules.pattern === undefined && rules.patternMessage === undefined) {
    if (readOnly) return null;
    return (
      <AddRow
        label="Add a pattern"
        inset="flush"
        onClick={() => {
          setOpen(true);
        }}
      />
    );
  }
  return (
    <div className={styles.pair}>
      <Field label="Pattern" hint="A regular expression the answer must match" error={error}>
        <Input
          mono
          ref={input}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          value={pattern}
          placeholder="^[A-Z]{2}\d{4}$"
          readOnly={readOnly}
          onChange={(event) => {
            const next = event.target.value;
            setOpen(true);
            setDraft(next);
            if (next && patternError(next)) return;
            actions.edit((form) => {
              setRule(form, field.uid, 'pattern', next);
            }, `${field.uid}:pattern`);
          }}
          onBlur={() => {
            if (!error) setDraft(null);
          }}
        />
      </Field>
      <Field label="Error if no match">
        <Input
          value={rules.patternMessage ?? ''}
          placeholder="Invalid format"
          readOnly={readOnly}
          onChange={(event) => {
            actions.edit((form) => {
              setRule(form, field.uid, 'patternMessage', event.target.value);
            }, `${field.uid}:patternMessage`);
          }}
        />
      </Field>
    </div>
  );
}
