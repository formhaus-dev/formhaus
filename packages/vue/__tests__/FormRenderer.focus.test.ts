import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

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

const validators = { neededForY: (_: unknown, values: Record<string, unknown>) => (values.y === 'yes' ? 'Not with Y' : null) };

const steps: FormDefinition = {
  id: 'steps',
  title: 'Steps',
  submit: { label: 'Send' },
  steps: [
    { id: 's1', title: 'One', fields: [
      { key: 'a', type: 'text', label: 'A' },
      { key: 'x', type: 'text', label: 'X', validation: { validator: 'neededForY' } },
    ] },
    { id: 's2', title: 'Two', fields: [{ key: 'y', type: 'text', label: 'Y' }] },
  ],
};

describe('FormRenderer focus and keyboard', () => {
  it('focuses the first invalid field after a failed submit', async () => {
    render(FormRenderer, { props: { definition: contact } });
    await fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /Email/ })));
  });

  it('focuses the first option of an invalid group', async () => {
    render(FormRenderer, { props: { definition: contact, initialValues: { email: 'a@b.co' } } });
    await fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'A' })));
  });

  it('shows the step with the error and focuses the field', async () => {
    const submitHandler = vi.fn();
    render(FormRenderer, { props: { definition: steps, validators, initialValues: { x: 'filled' }, submitHandler } });
    await fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await fireEvent.update(await screen.findByRole('textbox', { name: 'Y' }), 'yes');
    await waitFor(() => expect(document.querySelector('form')?.getAttribute('aria-busy')).toBe('false'));
    await fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /X/ })));
    expect(submitHandler).not.toHaveBeenCalled();
  });

  it('focuses the first invalid field after a failed Continue', async () => {
    const required: FormDefinition = { ...steps, steps: [
      { id: 's1', title: 'One', fields: [{ key: 'a', type: 'text', label: 'A' }, { key: 'b', type: 'text', label: 'B', validation: { required: true } }] },
      steps.steps![1],
    ] };
    render(FormRenderer, { props: { definition: required } });
    await fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /B/ })));
    expect(screen.getByRole('heading', { name: 'One' })).toBeDefined();
  });

  it('marks required inputs and shows the required marker', () => {
    render(FormRenderer, { props: { definition: contact } });
    const email = screen.getByRole('textbox', { name: /Email/ });

    expect(email.getAttribute('aria-required')).toBe('true');
    expect(email.labels?.[0]?.querySelector('.fh-field__required')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('textbox', { name: 'Name' }).hasAttribute('aria-required')).toBe(false);
  });

  it('uses a submit button for the primary action and submits once', async () => {
    const submitHandler = vi.fn();
    render(FormRenderer, { props: { definition: contact, initialValues: { email: 'a@b.co', plan: 'a' }, submitHandler } });
    const button = screen.getByRole('button', { name: 'Send' });
    await fireEvent.click(button);

    await waitFor(() => expect(submitHandler).toHaveBeenCalledTimes(1));
    expect(button.getAttribute('type')).toBe('submit');
  });
});
