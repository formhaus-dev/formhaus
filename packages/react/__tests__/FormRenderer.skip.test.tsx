import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import { FormActions } from '../src/FormActions';
import { FormRenderer } from '../src/FormRenderer';

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

async function next() {
  fireEvent.click(button('Continue'));
  await waitFor(() => expect(button('Back')).toBeDefined());
}

describe('FormRenderer skip and button roles', () => {
  it('renders primary, secondary and text buttons', async () => {
    render(<FormRenderer definition={definition} onSubmit={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Not now' })).toBeNull();
    await next();
    expect(button('Continue').className).toContain('fh-form-actions__button--primary');
    expect(button('Back').className).toContain('fh-form-actions__button--secondary');
    expect(button('Cancel').className).toContain('fh-form-actions__button--text');
    expect(button('Not now').className).toContain('fh-form-actions__button--text');
  });

  it('skips a step without validating and submits without it', async () => {
    const onSubmit = vi.fn();
    const onAnalyticsEvent = vi.fn();
    render(<FormRenderer definition={definition} onSubmit={onSubmit} onAnalyticsEvent={onAnalyticsEvent} />);
    fireEvent.change(screen.getByRole('textbox', { name: /Name/ }), { target: { value: 'Ada' } });
    await next();
    fireEvent.click(button('Not now'));
    await waitFor(() => expect(screen.getByRole('textbox', { name: /Notes/ })).toBeDefined());
    expect(onAnalyticsEvent).toHaveBeenCalledWith({ type: 'step_skipped', stepId: 'phone' });
    fireEvent.click(button('Skip notes'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada' }));
    expect(onAnalyticsEvent).toHaveBeenCalledWith({ type: 'step_skipped', stepId: 'notes' });
  });

  it('reports field errors when a skip submit fails validation', async () => {
    let failing = false;
    const onAnalyticsEvent = vi.fn();
    render(<FormRenderer definition={definition} validators={{ flaky: () => (failing ? 'Bad name' : null) }}
      onSubmit={() => {}} onAnalyticsEvent={onAnalyticsEvent} />);
    fireEvent.change(screen.getByRole('textbox', { name: /Name/ }), { target: { value: 'Ada' } });
    await next();
    fireEvent.click(button('Not now'));
    await waitFor(() => expect(screen.getByRole('textbox', { name: /Notes/ })).toBeDefined());
    failing = true;
    fireEvent.click(button('Skip notes'));
    await waitFor(() => expect(onAnalyticsEvent).toHaveBeenCalledWith({ type: 'field_error', fieldKey: 'name', error: 'Bad name' }));
  });

  it('hides skip on steps with next: false', () => {
    const steps = definition.steps!.map((step) => (step.id === 'name' ? { ...step, skip: { label: 'Later' }, next: false as const } : step));
    render(<FormRenderer definition={{ ...definition, steps }} onSubmit={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Later' })).toBeNull();
  });

  it('respects explicit variants and skip props', () => {
    render(
      <FormActions
        isFirstStep={false} isLastStep={false} isMultiStep
        backAction={{ label: 'Back', variant: 'text' }} skipAction={{ label: 'Later', variant: 'secondary' }}
        onSubmit={() => {}} onNext={() => {}} onPrev={() => {}} onCancel={() => {}} onSkip={() => {}}
      />,
    );
    expect(button('Back').className).toContain('fh-form-actions__button--text');
    expect(button('Later').className).toContain('fh-form-actions__button--secondary');
  });

  it('hides skip when showSkip is false', () => {
    const props = { isFirstStep: true, isLastStep: false, isMultiStep: true, skipAction: { label: 'Later' },
      onSubmit: () => {}, onNext: () => {}, onPrev: () => {}, onCancel: () => {} };
    const { rerender } = render(<FormActions {...props} />);
    expect(button('Later')).toBeDefined();
    rerender(<FormActions {...props} onSkip={() => {}} showSkip={false} />);
    expect(screen.queryByRole('button', { name: 'Later' })).toBeNull();
    rerender(<FormActions {...props} onSkip={() => {}} skipLabel="Skip it" />);
    expect(button('Skip it')).toBeDefined();
  });
});
