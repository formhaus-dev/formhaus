import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { expect, it, vi } from 'vitest';
import type { FormDefinition } from '@formhaus/core';
import rawDefinition from '../../../examples/definitions/branching-form.json';
import FormRenderer from '../src/FormRenderer.vue';
import HeadlessFormRenderer from '../src/HeadlessFormRenderer.vue';
import FormActions from '../src/FormActions.vue';
import RadioField from '../src/fields/RadioField.vue';
import TextField from '../src/fields/TextField.vue';

const definition = rawDefinition as FormDefinition;

it.each([FormRenderer, HeadlessFormRenderer])('runs routed activation, validation and hooks', async (Renderer) => {
  const onSubmit = vi.fn();
  const change = vi.fn();
  render(Renderer, {
    props: {
      definition,
      components: { radio: RadioField, text: TextField },
      actionsComponent: FormActions,
      onSubmit,
      onAfterStepChange: change,
    },
  });
  await fireEvent.click(screen.getByLabelText('Business'));
  const company = await screen.findByRole('textbox', { name: /Company/ });
  await waitFor(() => expect((company as HTMLInputElement).disabled).toBe(false));
  await fireEvent.update(company, 'Acme');
  await fireEvent.click(screen.getByText('Continue'));
  await screen.findByText('Create account');
  await fireEvent.click(screen.getByText('Back'));
  await screen.findByRole('textbox', { name: /Company/ });
  await waitFor(() => expect((screen.getByText('Back') as HTMLButtonElement).disabled).toBe(false));
  await fireEvent.click(screen.getByText('Back'));
  await screen.findByLabelText('Personal');
  await waitFor(() => expect((screen.getByLabelText('Personal') as HTMLInputElement).disabled).toBe(false));
  await fireEvent.click(screen.getByLabelText('Personal'));
  const name = await screen.findByRole('textbox', { name: /Name/ });
  await waitFor(() => expect((name as HTMLInputElement).disabled).toBe(false));
  await fireEvent.update(name, 'Ada');
  await fireEvent.click(screen.getByText('Continue'));
  const send = await screen.findByText('Create account');
  await waitFor(() => expect((send as HTMLButtonElement).disabled).toBe(false));
  await fireEvent.click(send);
  expect(onSubmit).toHaveBeenCalledWith({ kind: 'personal', name: 'Ada' }, expect.any(Array));
  expect(change).toHaveBeenCalledWith(expect.objectContaining({ toStepId: 'personal', reason: 'autoAdvance' }));
});
