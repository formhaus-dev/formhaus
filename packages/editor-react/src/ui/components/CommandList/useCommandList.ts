import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon?: ReactNode;
  keywords?: string;
  group?: string;
  disabled?: boolean;
}

export interface CommandListOptions {
  items: CommandItem[];
  query: string;
  onSelect: (id: string) => void;
  onEscape?: () => void;
}

export function filterCommands(items: CommandItem[], query: string): CommandItem[] {
  const needles = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!needles.length) return items;
  return items.filter((item) => {
    const haystack = `${item.label} ${item.hint ?? ''} ${item.keywords ?? ''} ${item.group ?? ''}`.toLowerCase();
    return needles.every((needle) => haystack.includes(needle));
  });
}

export function useCommandList({ items, query, onSelect, onEscape }: CommandListOptions) {
  const listId = useId();
  const filtered = useMemo(() => filterCommands(items, query), [items, query]);
  const enabled = filtered.filter((item) => !item.disabled);
  const [picked, setPicked] = useState<string | null>(null);
  const activeId = enabled.some((item) => item.id === picked) ? picked : (enabled[0]?.id ?? null);
  const optionId = (id: string) => `${listId}-${id}`;

  function step(delta: number) {
    const index = enabled.findIndex((item) => item.id === activeId);
    const next = enabled[(index + delta + enabled.length) % enabled.length];
    if (next) setPicked(next.id);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.nativeEvent.isComposing) return;
    const moves: Record<string, () => void> = {
      ArrowDown: () => {
        step(1);
      },
      ArrowUp: () => {
        step(-1);
      },
      Home: () => {
        setPicked(enabled[0]?.id ?? null);
      },
      End: () => {
        setPicked(enabled.at(-1)?.id ?? null);
      },
      Enter: () => {
        if (activeId) onSelect(activeId);
      },
      Escape: () => {
        onEscape?.();
      },
    };
    const move = moves[event.key];
    if (!move || (event.key === 'Escape' && !onEscape) || ((event.key === 'Home' || event.key === 'End') && query)) return;
    event.preventDefault();
    move();
  }

  return {
    filtered,
    activeId,
    setActiveId: setPicked,
    optionId,
    inputProps: {
      role: 'combobox' as const,
      'aria-expanded': true,
      'aria-controls': listId,
      'aria-autocomplete': 'list' as const,
      'aria-activedescendant': activeId ? optionId(activeId) : undefined,
      onKeyDown,
    },
    listProps: { id: listId, role: 'listbox' as const },
  };
}

export type CommandListState = ReturnType<typeof useCommandList>;
