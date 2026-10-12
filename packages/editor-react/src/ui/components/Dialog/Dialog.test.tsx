import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/render';
import { Dialog, Drawer } from './Dialog';

function Controlled() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open menu
      </button>
      <Drawer title="Navigation" open={open} onOpenChange={setOpen} />
    </>
  );
}

describe('Dialog', () => {
  it('returns focus to the control that opened it when it has no trigger', async () => {
    renderWithProviders(<Controlled />);
    const opener = screen.getByRole('button', { name: 'Open menu' });
    await userEvent.click(opener);
    expect(screen.getByRole('dialog', { name: 'Navigation' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(opener).toHaveFocus();
  });

  it('opens from its trigger, traps focus and closes on Escape', async () => {
    renderWithProviders(
      <Dialog title="Rotate secret" description="The old secret stops working." trigger={<button type="button">Rotate</button>}>
        <input aria-label="Reason" />
      </Dialog>,
    );
    const trigger = screen.getByRole('button', { name: 'Rotate' });
    await userEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Rotate secret' });
    expect(dialog).toHaveAccessibleDescription('The old secret stops working.');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('closes from the close button', async () => {
    renderWithProviders(<Drawer title="Response" open={undefined} trigger={<button type="button">Open</button>} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('dialog', { name: 'Response' })).toHaveClass('right');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders header actions next to the close button', () => {
    renderWithProviders(<Drawer title="Response" open actions={<button type="button">Next response</button>} />);
    const dialog = screen.getByRole('dialog', { name: 'Response' });
    expect(within(dialog).getByRole('button', { name: 'Next response' }).nextElementSibling).toHaveAccessibleName('Close');
  });
});
