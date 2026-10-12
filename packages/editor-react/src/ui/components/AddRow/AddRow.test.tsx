import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddRow } from './AddRow';

describe('AddRow', () => {
  it('is one button whose whole row adds', async () => {
    const add = vi.fn();
    render(<AddRow label="Add field" inset="card" onClick={add} />);
    const row = screen.getByRole('button', { name: 'Add field' });
    expect(row).toHaveAttribute('type', 'button');
    await userEvent.click(row);
    expect(add).toHaveBeenCalledOnce();
  });

  it('can be disabled', async () => {
    const add = vi.fn();
    render(<AddRow label="Add option" inset="option" disabled onClick={add} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add option' }));
    expect(add).not.toHaveBeenCalled();
  });
});
