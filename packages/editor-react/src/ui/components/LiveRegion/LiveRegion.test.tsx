import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LiveRegionProvider } from './LiveRegion';
import { useAnnounce } from './useAnnounce';

function Mover() {
  const announce = useAnnounce();
  return (
    <button
      type="button"
      onClick={() => {
        announce('Email moved to position 3 of 5');
      }}
    >
      Move
    </button>
  );
}

describe('LiveRegion', () => {
  it('announces messages politely and repeats identical ones', async () => {
    render(
      <LiveRegionProvider>
        <Mover />
      </LiveRegionProvider>,
    );
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    await userEvent.click(screen.getByRole('button', { name: 'Move' }));
    await waitFor(() => {
      expect(region).toHaveTextContent('Email moved to position 3 of 5');
    });
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback));
    await userEvent.click(screen.getByRole('button', { name: 'Move' }));
    expect(region).toHaveTextContent('');
    act(() => {
      for (const frame of frames.splice(0)) frame(0);
    });
    await waitFor(() => {
      expect(region).toHaveTextContent('Email moved to position 3 of 5');
    });
  });

  it('is a no-op without a provider', async () => {
    render(<Mover />);
    await userEvent.click(screen.getByRole('button', { name: 'Move' }));
    expect(screen.queryByRole('status')).toBeNull();
  });
});
