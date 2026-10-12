import type { FormDefinition } from '@formhaus/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EditorRoot } from './EditorRoot';
import { createMemoryHost } from './hosts/memoryHost';
import { LinkProvider } from './ui';
import { TextLink } from './ui/components/TextLink/TextLink';

const definition: FormDefinition = {
  id: 'contact',
  title: 'Contact',
  submit: { label: 'Send' },
  fields: [{ key: 'email', type: 'email', label: 'Email' }],
};

describe('EditorRoot', () => {
  it('loads the host draft into the canvas without a publish button', async () => {
    render(<EditorRoot host={createMemoryHost({ Preview: () => null, definition })} />);
    expect(await screen.findByDisplayValue('Email')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
  });

  it('renders links through the host link component', () => {
    render(
      <LinkProvider value={({ href, children }) => <a href={`/app${href}`}>{children}</a>}>
        <TextLink href="/forms">Forms</TextLink>
      </LinkProvider>,
    );
    expect(screen.getByRole('link', { name: 'Forms' })).toHaveAttribute('href', '/app/forms');
  });
});
