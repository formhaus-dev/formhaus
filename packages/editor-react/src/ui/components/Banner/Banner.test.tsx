import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Banner } from './Banner';

describe('Banner', () => {
  it('announces danger as an alert with its action', () => {
    render(
      <Banner tone="danger" title="Could not load forms" action={<button type="button">Retry</button>}>
        Check your connection.
      </Banner>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not load forms');
    expect(alert).toHaveClass('danger');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('uses a polite status for other tones', () => {
    render(<Banner tone="warning">1,000 of 1,000 used.</Banner>);
    expect(screen.getByRole('status')).toHaveTextContent('1,000 of 1,000 used.');
  });
});
