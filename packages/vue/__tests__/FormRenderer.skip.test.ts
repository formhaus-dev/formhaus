import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';
import type { FormDefinition } from '@formhaus/core';
import FormRenderer from '../src/FormRenderer.vue';
import FormActions from '../src/FormActions.vue';

const definition: FormDefinition = {
  id: 'skip',
  title: 'Skip',
  submit: { label: 'Send' },
  cancel: { label: 'Cancel' },
  steps: [
    { id: 'name', title: 'Name', fields: [{ key: 'name', type: 'text', label: 'Name', validation: { validator: 'flaky' } }] },
    {
      id: 'phone',
      title: 'Phone',
      skip: { label: 'Not now' },
      fields: [{ key: 'phone', type: 'text', label: 'Phone', validation: { required: true } }],
    },
    { id: 'notes', title: 'Notes', skip: { label: 'Skip notes' }, fields: [{ key: 'notes', type: 'text', label: 'Notes' }] },
  ],
};

function button(name: string): HTMLButtonElement {
  return screen.getByRole('button', { name });
}

describe('FormRenderer skip and button roles', () => {
  it('renders button roles, skips without validation and submits without skipped steps', async () => {
    const submitHandler = vi.fn();
    const { emitted } = render(FormRenderer, { props: { definition, submitHandler } });
    expect(screen.queryByRole('button', { name: 'Not now' })).toBeNull();
    await fireEvent.update(screen.getByRole('textbox', { name: /Name/ }), 'Ada');
    await fireEvent.click(button('Continue'));
    await screen.findByRole('textbox', { name: /Phone/ });
    expect(button('Continue').className).toContain('fh-form-actions__button--primary');
    expect(button('Back').className).toContain('fh-form-actions__button--secondary');
    expect(button('Cancel').className).toContain('fh-form-actions__button--text');
    expect(button('Not now').className).toContain('fh-form-actions__button--text');
    await fireEvent.click(button('Not now'));
    await screen.findByRole('textbox', { name: /Notes/ });
    expect(emitted().analyticsEvent).toContainEqual([{ type: 'step_skipped', stepId: 'phone' }]);
    await fireEvent.click(button('Skip notes'));
    await waitFor(() => expect(submitHandler).toHaveBeenCalledWith({ name: 'Ada' }));
    expect(emitted().analyticsEvent).toContainEqual([{ type: 'step_skipped', stepId: 'notes' }]);
  });

  it('reports field errors when a skip submit fails validation', async () => {
    let failing = false;
    const { emitted } = render(FormRenderer, { props: { definition, validators: { flaky: () => (failing ? 'Bad name' : null) } } });
    await fireEvent.update(screen.getByRole('textbox', { name: /Name/ }), 'Ada');
    await fireEvent.click(button('Continue'));
    await screen.findByRole('textbox', { name: /Phone/ });
    await fireEvent.click(button('Not now'));
    await screen.findByRole('textbox', { name: /Notes/ });
    failing = true;
    await fireEvent.click(button('Skip notes'));
    await waitFor(() => expect(emitted().analyticsEvent).toContainEqual([{ type: 'field_error', fieldKey: 'name', error: 'Bad name' }]));
  });

  it('hides skip on steps with next: false', () => {
    const steps = definition.steps!.map((step) => (step.id === 'name' ? { ...step, skip: { label: 'Later' }, next: false as const } : step));
    render(FormRenderer, { props: { definition: { ...definition, steps } } });
    expect(screen.queryByRole('button', { name: 'Later' })).toBeNull();
  });

  it('uses role classes for Back and Cancel unless a variant is set', async () => {
    const base = { isFirstStep: false, isLastStep: false, isMultiStep: true };
    const { rerender } = render(FormActions, { props: { ...base, backAction: { label: 'Edit' }, cancelAction: { label: 'Cancel' } } });
    expect(button('Edit').className).toContain('fh-form-actions__button--secondary');
    expect(button('Cancel').className).toContain('fh-form-actions__button--text');
    await rerender({ cancelAction: { label: 'Cancel', variant: 'secondary' } });
    expect(button('Cancel').className).toContain('fh-form-actions__button--secondary');
    expect(button('Continue')).toBeDefined();
  });

  it('respects explicit variants and skip props', async () => {
    const { emitted, rerender } = render(FormActions, { props: {
      isFirstStep: false, isLastStep: false, isMultiStep: true, showBack: true,
      backAction: { label: 'Back', variant: 'text' }, skipAction: { label: 'Later', variant: 'secondary' },
    } });
    expect(button('Back').className).toContain('fh-form-actions__button--text');
    expect(button('Later').className).toContain('fh-form-actions__button--secondary');
    await fireEvent.click(button('Later'));
    expect(emitted().skip).toHaveLength(1);
    await rerender({ skipLabel: 'Skip it' });
    expect(button('Skip it')).toBeDefined();
    await rerender({ showSkip: false });
    expect(screen.queryByRole('button', { name: 'Skip it' })).toBeNull();
  });
});
