import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/render';
import { Popover, PopoverClose } from './Popover';

describe('Popover', () => {
  it('opens from its trigger, closes on Escape and returns focus', async () => {
    renderWithProviders(
      <Popover label="Field types" trigger={<button type="button">Add field</button>}>
        <button type="button">Short text</button>
      </Popover>,
    );
    const trigger = screen.getByRole('button', { name: 'Add field' });
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Field types' })).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('closes from a close control and reports open changes', async () => {
    const changes: boolean[] = [];
    renderWithProviders(
      <Popover label="Menu" trigger={<button type="button">More</button>} onOpenChange={(open) => changes.push(open)}>
        <PopoverClose>Done</PopoverClose>
      </Popover>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'More' }));
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(changes).toEqual([true, false]);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders controlled content next to an anchor without a trigger', () => {
    renderWithProviders(
      <Popover open label="Palette" anchor={<div>Label input</div>} width="wide">
        <p>Pick a type</p>
      </Popover>,
    );
    expect(screen.getByRole('dialog', { name: 'Palette' })).toHaveClass('wide');
  });
});
