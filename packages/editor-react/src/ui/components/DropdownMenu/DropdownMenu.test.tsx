import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/render';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLink,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu';

describe('DropdownMenu', () => {
  it('opens from the keyboard and runs items', async () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button type="button">Account</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>mira@example.com</DropdownMenuLabel>
          <DropdownMenuItem checked onSelect={onSelect}>
            Acme
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLink href="/settings/members">Members</DropdownMenuLink>
          <DropdownMenuItem tone="danger">Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    screen.getByRole('button', { name: 'Account' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('mira@example.com')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Members' })).toHaveAttribute('href', '/settings/members');
    await userEvent.click(screen.getByRole('menuitem', { name: 'Acme' }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
