import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('announces loading by default', () => {
    render(<Spinner />);
    expect(screen.getByRole('status', { name: 'Loading' })).toHaveClass('md');
  });

  it('is decorative with an empty label', () => {
    const { container } = render(<Spinner label="" size="sm" />);
    expect(screen.queryByRole('status')).toBeNull();
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
