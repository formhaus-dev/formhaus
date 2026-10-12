import { useEffect, useId, useRef } from 'react';
import { cx } from '../../lib/cx';
import styles from './CommandList.module.css';
import type { CommandItem, CommandListState } from './useCommandList';

export interface CommandOptionsProps {
  state: CommandListState;
  label: string;
  onSelect: (id: string) => void;
  emptyText?: string;
  layout?: 'list' | 'grid';
}

function sections(items: CommandItem[]): { group: string | undefined; items: CommandItem[] }[] {
  const out: { group: string | undefined; items: CommandItem[] }[] = [];
  for (const item of items) {
    const last = out.at(-1);
    if (last && last.group === item.group) last.items.push(item);
    else out.push({ group: item.group, items: [item] });
  }
  return out;
}

export function CommandOptions({ state, label, onSelect, emptyText = 'No matches', layout = 'list' }: CommandOptionsProps) {
  const list = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const { filtered, activeId, setActiveId, optionId, listProps } = state;

  useEffect(() => {
    if (!activeId) return;
    list.current?.ownerDocument.getElementById(optionId(activeId))?.scrollIntoView({ block: 'nearest' });
  }, [activeId, optionId]);

  if (!filtered.length) {
    return (
      <p className={styles.empty} role="status">
        {emptyText}
      </p>
    );
  }

  const option = (item: CommandItem) => (
    <div
      key={item.id}
      id={optionId(item.id)}
      role="option"
      aria-selected={item.id === activeId}
      aria-disabled={item.disabled || undefined}
      className={cx(styles.option, item.id === activeId && styles.active)}
      onPointerDown={(event) => {
        event.preventDefault();
      }}
      onPointerMove={() => {
        if (!item.disabled && item.id !== activeId) setActiveId(item.id);
      }}
      onClick={() => {
        if (!item.disabled) onSelect(item.id);
      }}
    >
      {item.icon && (
        <span className={styles.icon} aria-hidden>
          {item.icon}
        </span>
      )}
      <span className={styles.text}>
        <span className={styles.label}>{item.label}</span>
        {item.hint && <span className={styles.hint}>{item.hint}</span>}
      </span>
    </div>
  );

  return (
    <div ref={list} {...listProps} aria-label={label} className={cx(styles.list, layout === 'grid' && styles.grid)}>
      {sections(filtered).map((section, index) =>
        section.group ? (
          <div key={section.group} role="group" aria-labelledby={`${headingId}-${String(index)}`} className={styles.group}>
            <div id={`${headingId}-${String(index)}`} className={styles.heading}>
              {section.group}
            </div>
            <div className={styles.items}>{section.items.map(option)}</div>
          </div>
        ) : (
          <div key={`items-${String(index)}`} className={styles.items}>
            {section.items.map(option)}
          </div>
        ),
      )}
    </div>
  );
}
