import { findField, setRule, type BuilderQuestion } from '@formhaus/builder';
import { useRef, useState } from 'react';
import { Field, Input } from '../ui';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';
import { checkLimits, limitWrites, storedLimits, type Drafts, type LimitSide, type LimitSpec } from './limits';
import { PatternSettings } from './PatternSettings';

interface Props {
  field: BuilderQuestion;
  spec: LimitSpec;
  actions: EditorActions;
  readOnly: boolean;
}

export function LimitSettings({ field, spec, actions, readOnly }: Props) {
  const rules = field.extra.validation ?? {};
  const [drafts, setDrafts] = useState<Drafts>({});
  const latest = useRef(drafts);
  const draft = (next: Drafts) => {
    latest.current = next;
    setDrafts(next);
  };
  const [left, setLeft] = useState<Partial<Record<LimitSide['rule'], boolean>>>({});
  const stored = storedLimits(spec, rules);
  const [seen, setSeen] = useState(stored);
  const own = useRef<string | null>(null);
  if (seen !== stored) {
    setSeen(stored);
    if (stored !== own.current) {
      draft({});
      setLeft({});
    }
  }
  const checked = checkLimits(spec, drafts, rules);
  const change = (rule: LimitSide['rule'], text: string) => {
    const next = { ...latest.current, [rule]: text };
    draft(next);
    actions.edit((form) => {
      const current = findField(form, field.uid)?.extra.validation ?? {};
      for (const [name, value] of limitWrites(spec, next, current)) setRule(form, field.uid, name, value);
      own.current = storedLimits(spec, findField(form, field.uid)?.extra.validation ?? {});
    }, `${field.uid}:${rule}`);
  };
  const settle = (rule: LimitSide['rule']) => {
    setLeft((before) => ({ ...before, [rule]: true }));
    if (checked[rule]?.error) return;
    const { [rule]: _done, ...rest } = latest.current;
    draft(rest);
  };
  const column = (bound: LimitSide) => {
    const result = checked[bound.rule];
    const value = result?.error ? undefined : result?.value;
    const message = rules[bound.message];
    return (
      <div className={styles.column}>
        <Field label={bound.label} error={left[bound.rule] ? result?.error : undefined}>
          <Input
            inputMode={spec.whole ? 'numeric' : 'decimal'}
            autoComplete="off"
            value={drafts[bound.rule] ?? (rules[bound.rule] === undefined ? '' : String(rules[bound.rule]))}
            placeholder="None"
            readOnly={readOnly}
            onChange={(event) => {
              change(bound.rule, event.target.value);
            }}
            onBlur={() => {
              settle(bound.rule);
            }}
          />
        </Field>
        {(value !== undefined || message !== undefined) && (
          <Field label={bound.messageLabel}>
            <Input
              value={message ?? ''}
              placeholder={value === undefined ? undefined : bound.fallback(value)}
              readOnly={readOnly}
              onChange={(event) => {
                actions.edit((form) => {
                  setRule(form, field.uid, bound.message, event.target.value);
                }, `${field.uid}:${bound.message}`);
              }}
            />
          </Field>
        )}
      </div>
    );
  };
  return (
    <section className={styles.section} aria-label="Limits">
      <span className={styles.controlLabel}>Limits</span>
      <div className={styles.pair}>
        {column(spec.low)}
        {column(spec.high)}
      </div>
      {spec.pattern && <PatternSettings field={field} actions={actions} readOnly={readOnly} />}
    </section>
  );
}
