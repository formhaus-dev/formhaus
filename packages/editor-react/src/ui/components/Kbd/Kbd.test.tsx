import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Kbd } from './Kbd';

describe('Kbd', () => {
  it('renders a keyboard key', () => {
    render(<Kbd>⌘K</Kbd>);
    const key = screen.getByText('⌘K');
    expect(key.tagName).toBe('KBD');
    expect(key).toHaveClass('kbd');
  });
});
