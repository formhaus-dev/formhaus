import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch', () => {
  it('toggles on click and with the keyboard', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Accept responses" onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole('switch', { name: 'Accept responses' });
    expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    expect(toggle).toBeChecked();
    toggle.focus();
    await userEvent.keyboard(' ');
    expect(toggle).not.toBeChecked();
    expect(onCheckedChange).toHaveBeenNthCalledWith(1, true);
  });

  it('follows the controlled value', async () => {
    render(<Switch label="Paused" checked disabled />);
    const toggle = screen.getByRole('switch', { name: 'Paused' });
    await userEvent.click(toggle);
    expect(toggle).toBeChecked();
    expect(toggle).toBeDisabled();
  });
});
