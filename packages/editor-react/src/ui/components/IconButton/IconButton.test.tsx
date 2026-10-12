import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Moon } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/render';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('has an accessible name and a matching tooltip', async () => {
    const onClick = vi.fn();
    renderWithProviders(<IconButton label="Toggle theme" icon={<Moon aria-hidden />} onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Toggle theme' });
    await userEvent.hover(button);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Toggle theme');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(button).toHaveClass('iconOnly');
  });
});
