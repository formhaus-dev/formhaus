import { canBranch, setOptionLabel, splitLines, type BuilderOption, type BuilderQuestion } from '@formhaus/builder';
import { GripVertical, X } from 'lucide-react';
import { useLayoutEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { AddRow, IconButton, InlineText, Sortable } from '../ui';
import { cx } from '../ui/lib/cx';
import { branchTargets, setJump } from '../logic/targets';
import { useForm, useReadOnly } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import { GoTo } from './GoTo';
import styles from './OptionsEditor.module.css';

interface Props {
  field: BuilderQuestion;
  actions: EditorActions;
}

const optionLabel = (option: BuilderOption, index: number) => option.label.trim() || `Option ${String(index + 1)}`;

export function OptionsEditor({ field, actions }: Props) {
  const readOnly = useReadOnly();
  const form = useForm();
  const targets = canBranch(field.type) ? branchTargets(form, field.uid) : [];
  const root = useRef<HTMLDivElement>(null);
  const pending = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!pending.current) return;
    root.current?.querySelector<HTMLElement>(`[data-option="${CSS.escape(pending.current)}"] textarea`)?.focus();
    pending.current = null;
  });

  const focusLater = (uid: string | undefined) => {
    pending.current = uid ?? null;
  };

  function onKey(event: KeyboardEvent<HTMLTextAreaElement>, option: BuilderOption, index: number) {
    if (event.key === 'Backspace' && !option.label && field.options.length > 1) {
      event.preventDefault();
      focusLater((index > 0 ? field.options[index - 1] : field.options[1])?.uid);
      actions.removeOption(field.uid, option.uid);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>, option: BuilderOption) {
    const lines = splitLines(event.clipboardData.getData('text'));
    if (lines.length < 2) return;
    event.preventDefault();
    const [first, ...rest] = lines;
    const fill = !option.label && first;
    if (fill) {
      actions.edit((form) => {
        setOptionLabel(form, field.uid, option.uid, first);
      });
    }
    const added = actions.addOptions(field.uid, fill ? rest : lines, option.uid);
    focusLater(added?.at(-1));
  }

  return (
    <div ref={root} className={styles.root}>
      <Sortable
        items={field.options.map((option) => ({ id: option.uid, option }))}
        label={`Options for ${field.label.trim() || 'this field'}`}
        getLabel={(item) => optionLabel(item.option, field.options.indexOf(item.option))}
        onMove={(id, to) => {
          actions.moveOption(field.uid, id, to);
        }}
        className={styles.list}
        renderItem={({ option }, { handleProps }) => {
          const index = field.options.indexOf(option);
          return (
            <div className={styles.row} data-option={option.uid}>
              <button {...handleProps} type="button" className={styles.grip} disabled={readOnly}>
                <GripVertical aria-hidden />
              </button>
              {field.type === 'select' ? (
                <span className={styles.number} aria-hidden>
                  {index + 1}
                </span>
              ) : (
                <span className={cx(styles.glyph, field.type === 'multiselect' && styles.square)} aria-hidden />
              )}
              <InlineText
                value={option.label}
                label={`Option ${String(index + 1)}`}
                placeholder={`Option ${String(index + 1)}`}
                readOnly={readOnly}
                rowClassName={styles.text}
                onValueChange={(label) => {
                  actions.edit((form) => {
                    setOptionLabel(form, field.uid, option.uid, label);
                  }, `${option.uid}:label`);
                }}
                onEnter={() => {
                  focusLater(actions.addOption(field.uid, option.uid));
                }}
                onKeyDown={(event) => {
                  onKey(event, option, index);
                }}
                onPaste={(event) => {
                  onPaste(event, option);
                }}
              />
              {targets.length > 0 && (
                <GoTo
                  option={option}
                  name={optionLabel(option, index)}
                  targets={targets}
                  readOnly={readOnly}
                  onChange={(target) => {
                    actions.edit((draft) => {
                      setJump(draft, field.uid, option.uid, target);
                    });
                  }}
                />
              )}
              {field.options.length > 1 && !readOnly && (
                <IconButton
                  label={`Remove ${optionLabel(option, index)}`}
                  icon={<X aria-hidden />}
                  className={styles.remove}
                  onClick={() => {
                    focusLater((index > 0 ? field.options[index - 1] : field.options[1])?.uid);
                    actions.removeOption(field.uid, option.uid);
                  }}
                />
              )}
            </div>
          );
        }}
      />
      {!readOnly && (
        <AddRow
          label="Add option"
          inset="option"
          onClick={() => {
            focusLater(actions.addOption(field.uid, field.options.at(-1)?.uid));
          }}
        />
      )}
    </div>
  );
}
