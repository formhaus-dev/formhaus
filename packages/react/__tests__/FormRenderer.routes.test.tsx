import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { FormDefinition } from '@formhaus/core';
import rawDefinition from '../../../examples/definitions/branching-form.json';
import { FormRenderer } from '../src/FormRenderer';
import { HeadlessFormRenderer } from '../src/HeadlessFormRenderer';
import { FormActions } from '../src/FormActions';
import { RadioField } from '../src/fields/RadioField';
import { TextField } from '../src/fields/TextField';

const definition = rawDefinition as FormDefinition;

it.each([FormRenderer, HeadlessFormRenderer])('runs routes and hooks through %s', async (Renderer) => {
  const submit = vi.fn();
  const change = vi.fn();
  render(<Renderer definition={definition} components={{ radio: RadioField, text: TextField }}
    ActionsComponent={FormActions} onSubmit={submit} onAfterStepChange={change} />);
  fireEvent.click(screen.getByLabelText('Business'));
  const company = await screen.findByRole('textbox', { name: /Company/ });
  await waitFor(() => expect((company as HTMLInputElement).disabled).toBe(false));
  fireEvent.change(company, { target: { value: 'Acme' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByRole('button', { name: 'Create account' })).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  await screen.findByRole('textbox', { name: /Company/ });
  await waitFor(() => expect((screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  await screen.findByLabelText('Personal');
  await waitFor(() => expect((screen.getByLabelText('Personal') as HTMLInputElement).disabled).toBe(false));
  fireEvent.click(screen.getByLabelText('Personal'));
  const name = await screen.findByRole('textbox', { name: /Name/ });
  await waitFor(() => expect((name as HTMLInputElement).disabled).toBe(false));
  fireEvent.change(name, { target: { value: 'Ada' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  const send = await screen.findByRole('button', { name: 'Create account' });
  await waitFor(() => expect((send as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(send);
  await waitFor(() => expect(submit).toHaveBeenCalledWith({ kind: 'personal', name: 'Ada' }, expect.any(Array)));
  expect(change).toHaveBeenCalledWith(expect.objectContaining({ toStepId: 'personal', reason: 'autoAdvance' }));
});
