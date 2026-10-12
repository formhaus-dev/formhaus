import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input, SearchInput } from './Input';

describe('Input', () => {
  it('accepts typing and forwards props', async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Name" placeholder="Acme" onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'hi');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('can be disabled and invalid', () => {
    render(<Input aria-label="Name" disabled aria-invalid />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('SearchInput', () => {
  it('renders a labelled search box', () => {
    render(<SearchInput aria-label="Filter forms" />);
    expect(screen.getByRole('searchbox', { name: 'Filter forms' })).toHaveAttribute('type', 'search');
  });
});
