import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/render';
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
});
