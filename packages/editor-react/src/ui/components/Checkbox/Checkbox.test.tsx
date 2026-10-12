import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('toggles when its label is clicked', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Email me" hint="One email per milestone." onChange={onChange} />);
    const box = screen.getByRole('checkbox', { name: /Email me/ });
    await userEvent.click(screen.getByText('Email me'));
    expect(box).toBeChecked();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('does not toggle when disabled', async () => {
    render(<Checkbox label="Locked" disabled />);
    const box = screen.getByRole('checkbox', { name: 'Locked' });
    await userEvent.click(box);
    expect(box).not.toBeChecked();
  });
});
