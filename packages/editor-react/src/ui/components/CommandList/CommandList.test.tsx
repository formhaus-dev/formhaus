import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/render';
import { CommandList } from './CommandList';
import { filterCommands, type CommandItem } from './useCommandList';

const items: CommandItem[] = [
  { id: 'text', label: 'Short text', hint: 'One line of text' },
  { id: 'email', label: 'Email', hint: 'Validated email address', keywords: 'mail' },
  { id: 'phone', label: 'Phone', hint: 'Phone number', disabled: true },
  { id: 'radio', label: 'Multiple choice', hint: 'Pick one' },
];

describe('filterCommands', () => {
  it('matches every word against label, hint and keywords', () => {
    expect(filterCommands(items, 'mail').map((item) => item.id)).toEqual(['email']);
    expect(filterCommands(items, 'pick one').map((item) => item.id)).toEqual(['radio']);
    expect(filterCommands(items, '  ')).toHaveLength(4);
  });
});

describe('CommandList', () => {
  it('moves the active option with arrows, skips disabled ones and selects on Enter', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<CommandList label="Field types" items={items} onSelect={onSelect} autoFocus />);
    const input = screen.getByRole('combobox', { name: 'Search field types' });
    expect(input).toHaveFocus();
    expect(screen.getByRole('option', { name: /Short text/ })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    const active = screen.getByRole('option', { name: /Multiple choice/ });
    expect(active).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', active.id);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith('text');
  });

  it('filters while typing and shows an empty state', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<CommandList label="Field types" items={items} onSelect={onSelect} autoFocus />);
    await userEvent.keyboard('choice{Enter}');
    expect(onSelect).toHaveBeenCalledWith('radio');
    await userEvent.keyboard('zzz');
    expect(screen.getByRole('status')).toHaveTextContent('No matches');
  });

  it('selects a whole row on click and reports Escape', async () => {
    const onSelect = vi.fn();
    const onEscape = vi.fn();
    renderWithProviders(<CommandList label="Field types" items={items} onSelect={onSelect} onEscape={onEscape} autoFocus />);
    await userEvent.click(screen.getByText('Validated email address'));
    expect(onSelect).toHaveBeenCalledWith('email');
    await userEvent.click(screen.getByRole('option', { name: /Phone/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Escape}');
    expect(onEscape).toHaveBeenCalledTimes(1);
  });
});

describe('CommandList groups', () => {
  it('renders labelled groups and searches by group name', async () => {
    const grouped: CommandItem[] = [
      { id: 'text', label: 'Short text', group: 'Text' },
      { id: 'email', label: 'Email', group: 'Contact' },
      { id: 'phone', label: 'Phone', group: 'Contact' },
    ];
    renderWithProviders(<CommandList label="Field types" items={grouped} onSelect={vi.fn()} layout="grid" autoFocus />);
    const contact = screen.getByRole('group', { name: 'Contact' });
    expect(contact).toHaveTextContent('Email');
    expect(contact).toHaveTextContent('Phone');
    await userEvent.keyboard('contact');
    expect(screen.queryByRole('group', { name: 'Text' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });
});
