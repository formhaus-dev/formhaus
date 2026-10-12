import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/render';
import { Sheet, type SheetDetent } from './Sheet';

function Harness({ onDetentChange }: { onDetentChange?: (detent: SheetDetent) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <Sheet title="Field settings" open={open} onOpenChange={setOpen} {...(onDetentChange ? { onDetentChange } : {})}>
      <input aria-label="Label" />
    </Sheet>
  );
}

describe('Sheet', () => {
  it('opens as a dialog at the medium detent and closes from its close button', async () => {
    renderWithProviders(<Harness />);
    const sheet = screen.getByRole('dialog', { name: 'Field settings' });
    expect(sheet).toHaveAttribute('data-detent', 'medium');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('toggles detents from the grabber with a tap or the keyboard', async () => {
    const onDetentChange = vi.fn<(detent: SheetDetent) => void>();
    renderWithProviders(<Harness onDetentChange={onDetentChange} />);
    const grabber = screen.getByRole('button', { name: 'Expand sheet' });
    fireEvent.pointerDown(grabber, { clientY: 400 });
    fireEvent.pointerUp(grabber, { clientY: 402 });
    expect(screen.getByRole('dialog')).toHaveAttribute('data-detent', 'large');
    screen.getByRole('button', { name: 'Collapse sheet' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onDetentChange.mock.calls.map(([detent]) => detent)).toEqual(['large', 'medium']);
  });

  it('expands on swipe up and closes on swipe down from medium', () => {
    renderWithProviders(<Harness />);
    const grabber = screen.getByRole('button', { name: 'Expand sheet' });
    fireEvent.pointerDown(grabber, { clientY: 400 });
    fireEvent.pointerUp(grabber, { clientY: 300 });
    expect(screen.getByRole('dialog')).toHaveAttribute('data-detent', 'large');
    const collapse = screen.getByRole('button', { name: 'Collapse sheet' });
    fireEvent.pointerDown(collapse, { clientY: 300 });
    fireEvent.pointerUp(collapse, { clientY: 400 });
    const medium = screen.getByRole('button', { name: 'Expand sheet' });
    fireEvent.pointerDown(medium, { clientY: 400 });
    fireEvent.pointerUp(medium, { clientY: 500 });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
