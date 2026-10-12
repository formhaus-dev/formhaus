import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Grid, Inline, Stack } from './Stack';

describe('layout helpers', () => {
  it('maps gap and alignment to tokens', () => {
    render(
      <Stack data-testid="stack" gap="4" align="center">
        <span>a</span>
      </Stack>,
    );
    const stack = screen.getByTestId('stack');
    expect(stack).toHaveClass('stack');
    expect(stack.style.getPropertyValue('--layout-gap')).toBe('var(--fh-ed-space-4)');
    expect(stack.style.getPropertyValue('--layout-align')).toBe('center');
  });

  it('lays inline content in a wrapping row unless told not to', () => {
    render(<Inline data-testid="row" wrap={false} justify="between" />);
    const row = screen.getByTestId('row');
    expect(row).toHaveClass('inline', 'nowrap');
    expect(row.style.getPropertyValue('--layout-justify')).toBe('space-between');
  });

  it('builds an auto-fill grid', () => {
    render(<Grid data-testid="grid" min="200px" />);
    expect(screen.getByTestId('grid').style.getPropertyValue('--grid-min')).toBe('200px');
  });
});
