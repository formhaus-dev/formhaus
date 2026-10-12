import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plus } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/render';
import { Button, LinkButton } from './Button';

describe('Button', () => {
  it('is a non-submitting button by default and runs onClick', async () => {
    const onClick = vi.fn();
    renderWithProviders(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)('applies the %s variant', (variant) => {
    renderWithProviders(<Button variant={variant}>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass(variant);
  });

  it('can collapse to its icon below md and keep its name', () => {
    renderWithProviders(
      <LinkButton href="/export.csv" icon={<Plus aria-hidden />} collapse="md">
        Export CSV
      </LinkButton>,
    );
    const link = screen.getByRole('link', { name: 'Export CSV' });
    expect(link).toHaveClass('collapseMd');
    expect(screen.getByText('Export CSV')).toHaveClass('fh-ed-sr-only-md');
  });

  it('is busy and disabled while loading', async () => {
    const onClick = vi.fn();
    renderWithProviders(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders a link button with an icon', () => {
    renderWithProviders(
      <LinkButton href="/forms/new" icon={<Plus aria-hidden />} variant="primary">
        New from JSON
      </LinkButton>,
    );
    const link = screen.getByRole('link', { name: 'New from JSON' });
    expect(link).toHaveAttribute('href', '/forms/new');
    expect(link).toHaveClass('button', 'primary');
  });
});
