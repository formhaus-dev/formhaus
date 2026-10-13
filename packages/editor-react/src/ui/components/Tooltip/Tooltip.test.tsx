import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/render';
import { setDragActive } from '../../lib/dragState';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('shows its content on keyboard focus', async () => {
    renderWithProviders(
      <Tooltip content="Toggle theme">
        <button type="button">T</button>
      </Tooltip>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'T' })).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Toggle theme');
  });

  it('hides an open tooltip and stays closed while a drag is active', async () => {
    renderWithProviders(
      <Tooltip content="Field actions">
        <button type="button">T</button>
      </Tooltip>,
    );
    await userEvent.tab();
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    act(() => {
      setDragActive(true);
    });
    expect(screen.queryByRole('tooltip')).toBeNull();
    await userEvent.hover(screen.getByRole('button', { name: 'T' }));
    expect(screen.queryByRole('tooltip')).toBeNull();
    act(() => {
      setDragActive(false);
    });
    await userEvent.unhover(screen.getByRole('button', { name: 'T' }));
    await userEvent.hover(screen.getByRole('button', { name: 'T' }));
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
  });
});
