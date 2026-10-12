import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/render';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('requires the confirmation text before confirming', async () => {
    const onConfirm = vi.fn(() => Promise.resolve());
    renderWithProviders(
      <ConfirmDialog
        title="Delete form"
        description="Responses are deleted too."
        confirmLabel="Delete form"
        confirmText="Waitlist"
        trigger={<button type="button">Delete…</button>}
        onConfirm={onConfirm}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete…' }));
    const confirm = screen.getByRole('button', { name: 'Delete form' });
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox', { name: 'Type “Waitlist” to confirm' }), '  Waitlist ');
    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith('Waitlist');
  });

  it.each([
    { confirmText: 'Acme', ignoreCase: false, typed: '  Acme ', ok: true },
    { confirmText: 'Acme', ignoreCase: false, typed: 'acme', ok: false },
    { confirmText: 'Mira@Acme.dev', ignoreCase: true, typed: ' mira@acme.DEV ', ok: true },
  ])('matches “$typed” against “$confirmText” after trimming', async ({ confirmText, ignoreCase, typed, ok }) => {
    renderWithProviders(
      <ConfirmDialog title="Delete" confirmLabel="Delete" confirmText={confirmText} ignoreCase={ignoreCase} open onConfirm={vi.fn()} />,
    );
    await userEvent.type(screen.getByRole('textbox'), typed);
    expect(screen.getByRole('button', { name: 'Delete' }).hasAttribute('disabled')).toBe(!ok);
  });

  it('closes after a successful confirm and stays open after a failure', async () => {
    let fail = true;
    const onConfirm = vi.fn(() => (fail ? Promise.reject(new Error('nope')) : Promise.resolve()));
    renderWithProviders(
      <ConfirmDialog title="Revoke key?" confirmLabel="Revoke key" trigger={<button type="button">Revoke</button>} onConfirm={onConfirm}>
        <p>Requests fail at once.</p>
      </ConfirmDialog>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(screen.getByText('Requests fail at once.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Revoke key' }));
    expect(screen.getByRole('dialog', { name: 'Revoke key?' })).toBeInTheDocument();
    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Revoke key' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('cancels without confirming', async () => {
    const onConfirm = vi.fn(() => Promise.resolve());
    renderWithProviders(<ConfirmDialog title="Sign out?" confirmLabel="Sign out" tone="primary" open onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
