import type { FormDefinition, FormEvent } from '../../src';
import { filled, wizard, type RendererHarness, type TestKit } from './fixtures';

const emails: FormDefinition = {
  id: 'emails',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'email', type: 'text', label: 'Email', validation: { required: true } },
    { key: 'confirm', type: 'text', label: 'Confirm email' },
  ],
};

export function validateScenarios(harness: RendererHarness, { it, expect, waitFor, screen, fn }: TestKit): void {
  const button = (name: string) => screen.getByRole('button', { name });
  const textbox = (name: string) => screen.getByRole('textbox', { name: new RegExp(name) });

  it('shows onValidate errors of the step and focuses the field', async () => {
    const onValidate = fn(async () => ({ name: 'Taken' }));
    harness.mount({ definition: wizard, initialValues: filled, onSubmit: () => {}, onValidate });
    await harness.click(button('Continue'));
    await screen.findByText('Taken');
    expect(onValidate).toHaveBeenCalledWith(filled, { stepId: 'one', fields: ['name'], submit: false }, expect.any(AbortSignal));
    expect(screen.getByRole('heading', { name: 'One' })).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(textbox('Name')));
  });

  it('opens the step of an onValidate error on submit and shows keys outside the form as form errors', async () => {
    const onSubmit = fn();
    const onValidate = fn((_: Record<string, unknown>, { submit }: { submit: boolean }) =>
      submit ? { name: 'Taken', '': 'Try again later' } : null,
    );
    harness.mount({ definition: wizard, initialValues: filled, errorSummary: false, onSubmit, onValidate });
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Two' });
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Three' });
    await harness.click(button('Send'));
    await screen.findByRole('heading', { name: 'One' });
    await screen.findByText('Try again later');
    expect(screen.getByText('Taken')).toBeTruthy();
    expect(onValidate).toHaveBeenLastCalledWith(
      filled,
      { stepId: 'three', fields: ['name', 'plan', 'city'], submit: true },
      expect.any(AbortSignal),
    );
    expect(onSubmit).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement).toBe(textbox('Name')));
  });

  it('clears onValidate form errors on the next Continue and on Back', async () => {
    let down = true;
    harness.mount({
      definition: wizard,
      initialValues: filled,
      onSubmit: () => {},
      onValidate: (_, { stepId }) => (down || stepId === 'two' ? { '': 'Service down' } : null),
    });
    await harness.click(button('Continue'));
    await screen.findByText('Service down');
    down = false;
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Two' });
    expect(screen.queryByText('Service down')).toBeNull();
    await harness.click(button('Continue'));
    await screen.findByText('Service down');
    await harness.click(button('Back'));
    await screen.findByRole('heading', { name: 'One' });
    expect(screen.queryByText('Service down')).toBeNull();
  });

  it('shows definition and onValidate errors of a step together with validateWithRules', async () => {
    const onValidate = fn(() => ({ name: 'Taken', '': 'Service down' }));
    harness.mount({ definition: wizard, errorSummary: true, onSubmit: () => {}, onValidate, validateWithRules: true });
    await harness.click(button('Continue'));
    await screen.findByText('Service down');
    expect(screen.getByRole('link', { name: 'Name: This field is required' })).toBeTruthy();
    expect(screen.queryByText('Taken')).toBeNull();
    expect(screen.getByRole('heading', { name: 'One' })).toBeTruthy();
    expect(onValidate).toHaveBeenCalledTimes(1);
  });

  it('shows definition and onValidate errors of a submit together with validateWithRules', async () => {
    const onSubmit = fn();
    const onFormEvent = fn();
    const onValidate = fn(() => ({ email: 'Use a work email', confirm: 'Emails must match', '': 'Check the form' }));
    harness.mount({ definition: emails, errorSummary: true, onSubmit, onValidate, onFormEvent, validateWithRules: true });
    await harness.click(button('Send'));
    await screen.findByRole('link', { name: 'Confirm email: Emails must match' });
    expect(screen.getByRole('link', { name: 'Email: This field is required' })).toBeTruthy();
    expect(screen.getByText('Check the form')).toBeTruthy();
    expect(screen.queryByText('Use a work email')).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
    const failed = onFormEvent.mock.calls.filter(([event]) => (event as FormEvent).type === 'form_submit_failed');
    expect(failed).toEqual([[{ type: 'form_submit_failed', reason: 'validation' }]]);
    await waitFor(() => expect(document.activeElement?.closest('.fh-error-summary')).toBeTruthy());
  });

  it('runs onValidate only after the definition rules pass without validateWithRules', async () => {
    const onValidate = fn(() => ({ confirm: 'Emails must match' }));
    harness.mount({ definition: emails, onSubmit: () => {}, onValidate });
    await harness.click(button('Send'));
    await screen.findByText('This field is required');
    expect(onValidate).not.toHaveBeenCalled();
  });
}
