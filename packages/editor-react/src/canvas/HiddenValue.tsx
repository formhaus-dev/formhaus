import { setFieldProp, type BuilderQuestion } from '@formhaus/builder';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { CommandList, Popover } from '../ui';
import { cx } from '../ui/lib/cx';
import { useHost } from '../store/context';
import type { EditorActions } from '../useEditorActions';
import preview from './FieldPreview.module.css';
import styles from './HiddenValue.module.css';
import { SOURCES, sourceChoice, sourceFor, sourceInfo } from './hiddenSources';

interface Props {
  field: BuilderQuestion;
  actions: EditorActions;
}

export function HiddenValue({ field, actions }: Props) {
  const host = useHost();
  const [open, setOpen] = useState(false);
  const choice = sourceChoice(field.extra.source);
  const current = sourceInfo(choice);
  const Icon = current.icon;
  const source = field.extra.source;
  const items = SOURCES.filter((item) => item.id !== 'country' || host.features?.country || choice === 'country').map(
    ({ id, label, hint, icon: ItemIcon }) => ({
      id,
      label,
      hint,
      icon: <ItemIcon aria-hidden />,
    }),
  );
  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <Popover
          open={open}
          onOpenChange={setOpen}
          label="Value from"
          width="wide"
          flush
          capped
          trigger={
            <button
              type="button"
              className={cx(preview.box, preview.editable, styles.trigger)}
              aria-label={`Value from: ${current.label}. Change`}
            >
              <span className={styles.prefix}>Value from</span>
              <Icon aria-hidden className={styles.icon} />
              <span className={styles.choice}>{current.label}</span>
              <ChevronDown aria-hidden className={preview.chevron} />
            </button>
          }
        >
          <CommandList
            items={items}
            label="Value sources"
            placeholder="Search sources"
            autoFocus
            onSelect={(id) => {
              setOpen(false);
              const next = SOURCES.find((item) => item.id === id);
              if (!next || next.id === choice) return;
              actions.edit((form) => {
                setFieldProp(form, field.uid, 'source', sourceFor(next.id, field));
              });
            }}
            onEscape={() => {
              setOpen(false);
            }}
          />
        </Popover>
        {typeof source === 'object' && (
          <label className={cx(preview.box, preview.editable, styles.field, styles.param)}>
            <span className={styles.prefix}>Parameter</span>
            <input
              className={styles.input}
              aria-label="URL parameter name"
              placeholder="utm_source"
              spellCheck={false}
              value={source.query}
              onChange={(event) => {
                const query = event.target.value.trim();
                actions.edit((form) => {
                  setFieldProp(form, field.uid, 'source', { query });
                }, `${field.uid}:source`);
              }}
            />
          </label>
        )}
      </div>
      <p className={styles.hint}>{current.hint}</p>
      <label className={cx(preview.box, preview.editable, styles.field)}>
        <span className={styles.prefix}>{choice === 'value' ? 'Value' : 'Fallback'}</span>
        <input
          className={styles.input}
          aria-label={choice === 'value' ? 'Value' : 'Fallback value'}
          value={typeof field.extra.defaultValue === 'string' ? field.extra.defaultValue : ''}
          placeholder={choice === 'value' ? 'black-friday' : 'Sent when the source is empty (optional)'}
          onChange={(event) => {
            actions.edit((form) => {
              setFieldProp(form, field.uid, 'defaultValue', event.target.value);
            }, `${field.uid}:defaultValue`);
          }}
        />
      </label>
    </div>
  );
}
