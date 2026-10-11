import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';

const contact: FormDefinition = {
  id: 'contact',
  title: 'Contact',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'email', type: 'email', label: 'Email', validation: { required: true } },
    { key: 'plan', type: 'radio', label: 'Plan', options: [{ value: 'a', label: 'A' }], validation: { required: true } },
  ],
};

const steps: FormDefinition = {
  id: 'steps',
  title: 'Steps',
  submit: { label: 'Send' },
  steps: [
    { id: 's1', title: 'One', fields: [
      { key: 'a', type: 'text', label: 'A' },
      { key: 'x', type: 'text', label: 'X', validation: { required: true }, show: [{ field: 'y', eq: 'yes' }] },
    ] },
    { id: 's2', title: 'Two', fields: [{ key: 'y', type: 'text', label: 'Y' }] },
  ],
};

describe('FormRenderer focus and keyboard', () => {
  it('focuses the first invalid field after a failed submit', async () => {
    render(<FormRenderer definition={contact} onSubmit={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /Email/ })));
  });

  it('focuses the first option of an invalid group', async () => {
    render(<FormRenderer definition={contact} initialValues={{ email: 'a@b.co' }} onSubmit={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'A' })));
  });

  it('shows the step with the error and focuses the field', async () => {
    const onSubmit = vi.fn();
    render(<FormRenderer definition={steps} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Y' }), { target: { value: 'yes' } });
    await waitFor(() => expect(document.querySelector('form')?.getAttribute('aria-busy')).toBe('false'));
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /X/ })));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('marks required inputs with aria-required', () => {
    render(<FormRenderer definition={contact} onSubmit={() => {}} />);

    expect(screen.getByRole('textbox', { name: /Email/ }).getAttribute('aria-required')).toBe('true');
    expect(screen.getByRole('textbox', { name: 'Name' }).hasAttribute('aria-required')).toBe(false);
  });

  it('uses a submit button for the primary action and submits once', async () => {
    const onSubmit = vi.fn();
    render(<FormRenderer definition={contact} initialValues={{ email: 'a@b.co', plan: 'a' }} onSubmit={onSubmit} />);
    const button = screen.getByRole('button', { name: 'Send' });
    fireEvent.click(button);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(button.getAttribute('type')).toBe('submit');
  });
});
