import { render, screen } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormRenderer, HeadlessFormRenderer } from '../src';

const definition: FormDefinition = {
  id: 'invoice',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'client', type: 'text', label: 'Client' },
    { key: 'rating', type: 'x-rating', label: 'Rating' },
    { key: 'note', type: 'x-rating', label: 'Note' },
  ],
};

const Text = () => <input aria-label="Client" />;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('field type without a component', () => {
  it('warns once per type and names the type in the placeholder', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<HeadlessFormRenderer definition={definition} components={{ text: Text }} onSubmit={() => {}} />);
    rerender(<HeadlessFormRenderer definition={definition} components={{ text: Text }} onSubmit={() => {}} />);
    expect(screen.getAllByText('Unsupported field type: x-rating')).toHaveLength(2);
    expect(warn.mock.calls).toEqual([
      [
        '[formhaus] No component is registered for the field type "x-rating", so it renders a placeholder. Registered types: text. Add a component for "x-rating" to components.',
      ],
    ]);
  });

  it('sends the warning to onWarning and lists the built-in types under FormRenderer', () => {
    const onWarning = vi.fn();
    render(<FormRenderer definition={definition} onSubmit={() => {}} onWarning={onWarning} />);
    const [[issue]] = onWarning.mock.calls.filter(([issue]) => issue.code === 'missing-component');
    expect(issue.severity).toBe('warning');
    expect(issue.message).toContain('Registered types: text, email, phone, number, password, select,');
  });

  it('hides the type and stays silent in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');
    render(<HeadlessFormRenderer definition={definition} components={{ text: Text }} onSubmit={() => {}} />);
    expect(screen.getAllByText('Unsupported field type')).toHaveLength(2);
    expect(warn).not.toHaveBeenCalled();
  });
});
