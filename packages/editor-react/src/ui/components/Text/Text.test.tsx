import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Text } from './Text';

describe('Text', () => {
  it('applies typographic variants', () => {
    render(
      <Text as="p" size="xs" tone="muted" mono truncate>
        aB3dE5gH7k
      </Text>,
    );
    const node = screen.getByText('aB3dE5gH7k');
    expect(node.tagName).toBe('P');
    expect(node).toHaveClass('xs', 'muted', 'mono', 'truncate');
  });

  it('defaults to body text', () => {
    render(<Text>Body</Text>);
    expect(screen.getByText('Body')).toHaveClass('md', 'default');
  });
});
