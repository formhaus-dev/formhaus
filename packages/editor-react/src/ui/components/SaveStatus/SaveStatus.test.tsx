import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/render';
import { SaveStatus } from './SaveStatus';

describe('SaveStatus', () => {
  it('describes each state in words and announces only the ones that need attention', () => {
    const { rerender } = renderWithProviders(<SaveStatus status="saving" />);
    expect(screen.getByText('Saving…')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    rerender(<SaveStatus status="offline" />);
    expect(screen.getByRole('status')).toHaveTextContent('Saved on this device');
  });

  it('shows how long ago a save happened', () => {
    const savedAt = new Date(Date.now() - 3 * 60_000).toISOString();
    renderWithProviders(<SaveStatus status="saved" savedAt={savedAt} />);
    expect(screen.getByText(/Saved/).closest('span')?.parentElement).toHaveTextContent('Saved · 3 min ago');
  });

  it('offers Retry after an error and Review after a conflict', async () => {
    const onRetry = vi.fn();
    const onResolve = vi.fn();
    const { rerender } = renderWithProviders(<SaveStatus status="error" onRetry={onRetry} onResolve={onResolve} />);
    expect(screen.getByRole('status')).toHaveTextContent('Couldn’t save');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(<SaveStatus status="conflict" onRetry={onRetry} onResolve={onResolve} />);
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Review' }));
    expect(onResolve).toHaveBeenCalledTimes(1);
  });
});
