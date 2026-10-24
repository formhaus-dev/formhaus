import type { FormDefinition } from '../../src';
import { filled, flat, wizard, type RendererHarness, type TestKit } from './fixtures';

export function focusScenarios(harness: RendererHarness, { it, expect, waitFor, screen }: TestKit): void {
  const active = () => document.activeElement;
  const textbox = (name: string) => screen.getByRole('textbox', { name: new RegExp(name) });
  const button = (name: string) => screen.getByRole('button', { name });
  const summary = () => document.querySelector('.fh-error-summary');
  const required: FormDefinition = { ...flat, fields: flat.fields!.map((field) => ({ ...field, validation: { required: true } })) };
  const settle = () =>
    new Promise((done) => {
      setTimeout(done);
    });

  async function toLastStep() {
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Two' });
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Three' });
  }

  it('focuses the first field that the server rejected on a single-step form', async () => {
    harness.mount({ definition: flat, onSubmit: () => ({ ok: false, errors: { second: 'Taken' } }) });
    await harness.click(button('Send'));
    await screen.findByText('Taken');
    await waitFor(() => expect(active()).toBe(textbox('Second')));
  });

  it('focuses the only invalid field after a failed Submit with one error', async () => {
    harness.mount({ definition: required, initialValues: { first: 'Ada' }, onSubmit: () => {} });
    await harness.click(button('Send'));
    await screen.findByText('This field is required');
    await waitFor(() => expect(active()).toBe(textbox('Second')));
  });

  it('focuses the error summary after a failed Submit with two errors', async () => {
    harness.mount({ definition: required, onSubmit: () => {} });
    await harness.click(button('Send'));
    await waitFor(() => expect(active()).toBe(summary()));
    expect(summary()?.getAttribute('tabindex')).toBe('-1');
    expect(summary()?.getAttribute('role')).toBe('alert');
  });

  it('focuses the first invalid field after two errors when the error summary is off', async () => {
    harness.mount({ definition: required, errorSummary: false, onSubmit: () => {} });
    await harness.click(button('Send'));
    await screen.findAllByText('This field is required');
    await waitFor(() => expect(active()).toBe(textbox('First')));
    expect(summary()).toBeNull();
  });

  it('opens the step with the first server error and focuses the summary for two errors', async () => {
    harness.mount({
      definition: wizard,
      initialValues: filled,
      onSubmit: () => ({ ok: false, errors: { city: 'Unknown', name: 'Taken' } }),
    });
    await toLastStep();
    await harness.click(button('Send'));
    await screen.findByRole('heading', { name: 'One' });
    await waitFor(() => expect(active()).toBe(summary()));
    await settle();
    expect(active()).toBe(summary());
  });

  it('opens the step with the first server error and focuses its field', async () => {
    harness.mount({
      definition: wizard,
      errorSummary: false,
      initialValues: filled,
      onSubmit: () => ({ ok: false, errors: { city: 'Unknown', name: 'Taken' } }),
    });
    await toLastStep();
    await harness.click(button('Send'));
    await screen.findByRole('heading', { name: 'One' });
    await waitFor(() => expect(active()).toBe(textbox('Name')));
  });

  it('focuses the field of a summary link on a single-step form', async () => {
    harness.mount({
      definition: flat,
      errorSummary: true,
      onSubmit: () => ({ ok: false, errors: { first: 'Bad first', second: 'Bad second' } }),
    });
    await harness.click(button('Send'));
    const link = await screen.findByRole('link', { name: 'Second: Bad second' });
    await waitFor(() => expect(active()).toBe(summary()));
    link.focus();
    await harness.click(link);
    await waitFor(() => expect(active()).toBe(textbox('Second')));
  });

  it('opens the step of a summary link and focuses the field', async () => {
    harness.mount({
      definition: wizard,
      initialValues: filled,
      errorSummary: true,
      onSubmit: () => ({ ok: false, errors: { name: 'Taken', city: 'Unknown' } }),
    });
    await toLastStep();
    await harness.click(button('Send'));
    const link = await screen.findByRole('link', { name: 'City: Unknown' });
    expect(screen.getByRole('link', { name: 'Name: Taken' })).toBeDefined();
    await waitFor(() => expect(active()).toBe(summary()));
    link.focus();
    await harness.click(link);
    await screen.findByRole('heading', { name: 'Three' });
    await waitFor(() => expect(active()).toBe(textbox('City')));
    await harness.click(screen.getByRole('link', { name: 'Name: Taken' }));
    await screen.findByRole('heading', { name: 'One' });
    await waitFor(() => expect(active()).toBe(textbox('Name')));
  });

  it('keeps focus in a text field when the errors prop changes', async () => {
    const mounted = harness.mount({ definition: flat, onSubmit: () => {} });
    const first = textbox('First');
    first.focus();
    await mounted.update({ errors: { second: 'Taken' } });
    await screen.findByText('Taken');
    await settle();
    expect(active()).toBe(first);
  });

  it('focuses the invalid field when the errors prop changes while a button has focus', async () => {
    const mounted = harness.mount({ definition: flat, onSubmit: () => {} });
    button('Send').focus();
    await mounted.update({ errors: { second: 'Taken' } });
    await screen.findByText('Taken');
    await waitFor(() => expect(active()).toBe(textbox('Second')));
  });

  it('opens the step of an errors prop field when a button has focus', async () => {
    const mounted = harness.mount({ definition: wizard, initialValues: filled, onSubmit: () => {} });
    await toLastStep();
    button('Send').focus();
    await mounted.update({ errors: { name: 'Taken' } });
    await screen.findByRole('heading', { name: 'One' });
    await waitFor(() => expect(active()).toBe(textbox('Name')));
  });

  it('does not move focus for errors passed on mount', async () => {
    harness.mount({ definition: flat, errors: { second: 'Taken' }, onSubmit: () => {} });
    await screen.findByText('Taken');
    await settle();
    expect(active()).toBe(document.body);
  });

  it('focuses the first invalid field after a failed Continue', async () => {
    harness.mount({ definition: wizard, onSubmit: () => {} });
    await harness.click(button('Continue'));
    await screen.findByText('This field is required');
    await waitFor(() => expect(active()).toBe(textbox('Name')));
  });

  it('focuses the first field of the next step', async () => {
    harness.mount({ definition: wizard, initialValues: filled, onSubmit: () => {} });
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Two' });
    await waitFor(() => expect(active()).toBe(screen.getByRole('radio', { name: 'Plan A' })));
  });

  it('focuses the checked radio of the next step and after Back', async () => {
    harness.mount({ definition: wizard, initialValues: { ...filled, plan: 'b' }, onSubmit: () => {} });
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Two' });
    await waitFor(() => expect(active()).toBe(screen.getByRole('radio', { name: 'Plan B' })));
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Three' });
    await harness.click(button('Back'));
    await screen.findByRole('heading', { name: 'Two' });
    await waitFor(() => expect(active()).toBe(screen.getByRole('radio', { name: 'Plan B' })));
  });

  it('focuses the step title instead of a field of the next step with stepFocus heading', async () => {
    harness.mount({ definition: wizard, initialValues: filled, stepFocus: 'heading', onSubmit: () => {} });
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Two' });
    await waitFor(() => expect(active()).toBe(screen.getByRole('heading', { name: 'Two' })));
    expect(active()?.getAttribute('tabindex')).toBe('-1');
  });

  it('focuses the first field with stepFocus heading when the step has no title', async () => {
    const untitled: FormDefinition = { ...wizard, steps: wizard.steps!.map((step) => ({ ...step, title: '' })) };
    harness.mount({ definition: untitled, initialValues: filled, stepFocus: 'heading', onSubmit: () => {} });
    await harness.click(button('Continue'));
    await waitFor(() => expect(active()).toBe(screen.getByRole('radio', { name: 'Plan A' })));
  });

  it('still focuses the invalid field after a failed Continue with stepFocus heading', async () => {
    harness.mount({ definition: wizard, stepFocus: 'heading', onSubmit: () => {} });
    await harness.click(button('Continue'));
    await screen.findByText('This field is required');
    await waitFor(() => expect(active()).toBe(textbox('Name')));
  });

  it('focuses Add in custom group markup from a count error summary link', async () => {
    const crew = { key: 'crew', type: 'group', label: 'Crew', validation: { minLength: 2 }, fields: [flat.fields![0]] };
    const definition: FormDefinition = { ...flat, fields: [crew] };
    harness.mount({ definition, components: harness.containers, initialValues: { crew: [{}] }, errorSummary: true, onSubmit: () => {} });
    await harness.click(button('Send'));
    const link = await screen.findByRole('link', { name: 'Crew: At least 2 required' });
    await waitFor(() => expect(active()).not.toBe(document.body));
    textbox('First').focus();
    await harness.click(link);
    await waitFor(() => expect(active()).toBe(button('More')));
  });
}
