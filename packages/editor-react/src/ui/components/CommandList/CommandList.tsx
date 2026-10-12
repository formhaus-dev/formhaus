import { useState } from 'react';
import { SearchInput } from '../Input/Input';
import styles from './CommandList.module.css';
import { CommandOptions } from './CommandOptions';
import { useCommandList, type CommandItem } from './useCommandList';

export interface CommandListProps {
  items: CommandItem[];
  label: string;
  onSelect: (id: string) => void;
  onEscape?: () => void;
  placeholder?: string;
  emptyText?: string;
  autoFocus?: boolean;
  layout?: 'list' | 'grid';
}

export function CommandList({
  items,
  label,
  onSelect,
  onEscape,
  placeholder = 'Search',
  emptyText,
  autoFocus = false,
  layout = 'list',
}: CommandListProps) {
  const [query, setQuery] = useState('');
  const state = useCommandList({ items, query, onSelect, ...(onEscape ? { onEscape } : {}) });
  return (
    <div className={styles.root}>
      <SearchInput
        {...state.inputProps}
        aria-label={`Search ${label.toLowerCase()}`}
        placeholder={placeholder}
        value={query}
        autoFocus={autoFocus}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
      />
      <CommandOptions state={state} label={label} layout={layout} onSelect={onSelect} {...(emptyText ? { emptyText } : {})} />
    </div>
  );
}
