import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/render';
import { TextLink } from './TextLink';

describe('TextLink', () => {
  it('opens external links in a new tab and says so', () => {
    renderWithProviders(
      <TextLink href="https://formhaus.dev/docs" external>
        Read the docs
      </TextLink>,
    );
    const link = screen.getByRole('link', { name: /Read the docs/ });
    expect(link).toHaveTextContent('(opens in a new tab)');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('keeps internal links in the same tab', () => {
    renderWithProviders(<TextLink href="/forms/new">Paste JSON instead</TextLink>);
    expect(screen.getByRole('link', { name: 'Paste JSON instead' })).not.toHaveAttribute('target');
  });
});
