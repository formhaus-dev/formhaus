import type { FormEvent, SubmitResult } from '../../src';
import { deferred, filled, wizard, type RendererHarness, type TestKit } from './fixtures';

export function flowScenarios(harness: RendererHarness, { it, expect, waitFor, screen, fn }: TestKit): void {
  const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
  const form = () => document.querySelector('form')!;
  const marks = () => [...document.querySelectorAll('.fh-step-progress__step')];

  it('marks steps with errors and the current step', async () => {
    harness.mount({
      definition: wizard,
      initialValues: filled,
      stepErrorMarks: true,
      onSubmit: () => ({ ok: false, errors: { name: 'Taken', plan: 'Sold out' } }),
    });
    await harness.click(button('Continue'));
    await harness.click(await screen.findByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { name: 'Three' });
    await harness.click(button('Send'));
    await screen.findByText('Taken');
    expect(marks().map((item) => item.textContent?.trim())).toEqual(['One · 1 error', 'Two · 1 error', 'Three']);
    expect(marks().map((item) => item.getAttribute('aria-current'))).toEqual(['step', null, null]);
    expect(marks()[0].classList.contains('fh-step-progress__step--invalid')).toBe(true);
    await harness.type(screen.getByRole('textbox', { name: /Name/ }), 'Grace');
    await waitFor(() => expect(marks()[0].textContent?.trim()).toBe('One'));
  });

  it('shows a field while a multiselect includes an option', async () => {
    const onSubmit = fn();
    harness.mount({
      definition: {
        formatVersion: '1.4',
        id: 'signup',
        title: '',
        submit: { label: 'Send' },
        fields: [
          {
            key: 'interests',
            type: 'multiselect',
            label: 'Interests',
            options: [
              { value: 'design', label: 'Design' },
              { value: 'other', label: 'Other' },
            ],
          },
          {
            key: 'otherInterest',
            type: 'text',
            label: 'Other interest',
            show: [{ field: 'interests', contains: 'other' }],
          },
        ],
      },
      onSubmit,
    });
    const other = () => screen.queryByRole('textbox', { name: /Other interest/ });
    await harness.click(screen.getByRole('checkbox', { name: 'Design' }));
    expect(other()).toBeNull();
    await harness.click(screen.getByRole('checkbox', { name: 'Other' }));
    await harness.type(await screen.findByRole('textbox', { name: /Other interest/ }), 'Chess');
    await harness.click(screen.getByRole('checkbox', { name: 'Other' }));
    await waitFor(() => expect(other()).toBeNull());
    await harness.click(button('Send'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ interests: ['design'] }, []));
  });

  it('advances on an autoAdvance answer', async () => {
    const onAnalyticsEvent = fn();
    harness.mount({ definition: wizard, initialValues: { name: 'Ada' }, onSubmit: () => {}, onAnalyticsEvent });
    expect(onAnalyticsEvent).toHaveBeenCalledWith({ type: 'form_viewed' });
    await harness.click(button('Continue'));
    await harness.click(await screen.findByRole('radio', { name: 'Plan B' }));
    await screen.findByRole('heading', { name: 'Three' });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /City/ })));
    expect(onAnalyticsEvent).toHaveBeenCalledWith({ type: 'step_completed', stepId: 'two' });
  });

  it('skips a step and submits without it', async () => {
    const onSubmit = fn();
    const onFormEvent = fn();
    harness.mount({ definition: wizard, initialValues: filled, onSubmit, onFormEvent });
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Two' });
    await harness.click(button('Skip'));
    await screen.findByRole('heading', { name: 'Three' });
    await harness.click(button('Back'));
    await screen.findByRole('heading', { name: 'Two' });
    expect((screen.getByRole('radio', { name: 'Plan A' }) as HTMLInputElement).checked).toBe(false);
    await harness.click(button('Skip'));
    await screen.findByRole('heading', { name: 'Three' });
    await harness.click(button('Send'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada', city: 'Oslo' }, ['two']));
    expect(onFormEvent.mock.calls.map(([event]) => (event as FormEvent).type).filter((type) => !type.startsWith('field_'))).toEqual([
      'form_viewed',
      'step_viewed',
      'step_completed',
      'step_viewed',
      'step_skipped',
      'step_viewed',
      'step_viewed',
      'step_skipped',
      'step_viewed',
      'form_submitted',
      'form_submit_succeeded',
    ]);
  });

  it('shows the busy state while a submission is pending', async () => {
    const response = deferred<SubmitResult>();
    harness.mount({ definition: wizard, initialValues: filled, onSubmit: () => response.promise });
    await harness.click(button('Continue'));
    await harness.click(await screen.findByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { name: 'Three' });
    await harness.click(button('Send'));
    await waitFor(() => expect(form().getAttribute('aria-busy')).toBe('true'));
    expect([
      button('Send').disabled,
      button('Back').disabled,
      (screen.getByRole('textbox', { name: /City/ }) as HTMLInputElement).disabled,
    ]).toEqual([true, true, true]);
    expect(button('Send').getAttribute('aria-busy')).toBe('true');
    response.resolve({ ok: false, errors: { city: 'Unknown' } });
    await screen.findByText('Unknown');
    expect(form().getAttribute('aria-busy')).toBe('false');
    expect([button('Send').disabled, button('Back').disabled]).toEqual([false, false]);
    expect(button('Send').getAttribute('aria-busy')).toBe('false');
  });

  it('shows the busy state while a step check is pending', async () => {
    const check = deferred<Record<string, string> | null>();
    harness.mount({ definition: wizard, initialValues: filled, onSubmit: () => {}, onStepValidate: () => check.promise });
    await harness.click(button('Continue'));
    await waitFor(() => expect(form().getAttribute('aria-busy')).toBe('true'));
    expect(button('Continue').disabled).toBe(true);
    check.resolve({ name: 'Taken' });
    await screen.findByText('Taken');
    expect(form().getAttribute('aria-busy')).toBe('false');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /Name/ })));
  });

  it('uses the labels prop for buttons, the counter and the summary', async () => {
    const labels = { continue: 'Weiter', back: 'Zurück', stepOf: 'Schritt {current} von {total}', errorSummary: 'Bitte prüfen' };
    harness.mount({ definition: wizard, labels, errorSummary: true, onSubmit: () => {} });
    expect(document.querySelector('.fh-step-progress__counter')?.textContent?.trim()).toBe('Schritt 1 von 3');
    await harness.click(button('Weiter'));
    await screen.findByText('Bitte prüfen');
    await harness.type(screen.getByRole('textbox', { name: /Name/ }), 'Ada');
    await harness.click(button('Weiter'));
    await screen.findByRole('heading', { name: 'Two' });
    expect(button('Zurück')).toBeDefined();
    expect(document.querySelector('.fh-step-progress__counter')?.textContent?.trim()).toBe('Schritt 2 von 3');
  });

  it('reports form events with their details', async () => {
    const onFormEvent = fn();
    const onFieldChange = fn();
    harness.mount({
      definition: wizard,
      initialValues: { plan: 'a', city: 'Oslo' },
      onSubmit: () => ({ ok: false, errors: { city: 'Unknown' } }),
      onFormEvent,
      onFieldChange,
    });
    await harness.type(screen.getByRole('textbox', { name: /Name/ }), 'Ada');
    expect(onFieldChange).toHaveBeenCalledWith('name', 'Ada', expect.objectContaining({ name: 'Ada' }));
    await harness.click(button('Continue'));
    await harness.click(await screen.findByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { name: 'Three' });
    await harness.click(button('Send'));
    await screen.findByText('Unknown');
    expect(
      onFormEvent.mock.calls
        .map(([event]) => event)
        .filter((event) => !['field_focused', 'field_blurred'].includes((event as FormEvent).type)),
    ).toEqual([
      { type: 'form_viewed' },
      { type: 'step_viewed', stepId: 'one', stepIndex: 0 },
      { type: 'step_completed', stepId: 'one' },
      { type: 'step_viewed', stepId: 'two', stepIndex: 1 },
      { type: 'step_completed', stepId: 'two' },
      { type: 'step_viewed', stepId: 'three', stepIndex: 2 },
      { type: 'form_submitted', fieldCount: 3 },
      { type: 'form_submit_failed', reason: 'rejected' },
      { type: 'field_error', fieldKey: 'city', error: 'Unknown' },
    ]);
  });

  it('reports a jump to a rejected field as a step view', async () => {
    const onFormEvent = fn();
    harness.mount({
      definition: wizard,
      initialValues: filled,
      errorSummary: true,
      onSubmit: () => ({ ok: false, errors: { name: 'Taken' } }),
      onFormEvent,
    });
    await harness.click(button('Continue'));
    await harness.click(await screen.findByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { name: 'Three' });
    await harness.click(button('Send'));
    await harness.click(await screen.findByRole('link', { name: /Taken/ }));
    await screen.findByRole('heading', { name: 'One' });
    const views = onFormEvent.mock.calls.map(([event]) => event as FormEvent).filter((event) => event.type === 'step_viewed');
    expect(views.at(-1)).toEqual({ type: 'step_viewed', stepId: 'one', stepIndex: 0 });
    expect(views).toHaveLength(4);
  });

  it('reports step validation errors and a thrown submit handler', async () => {
    const onFormEvent = fn();
    harness.mount({
      definition: wizard,
      initialValues: { plan: 'a', city: 'Oslo' },
      onSubmit: () => {
        throw new Error('Offline');
      },
      onFormEvent,
    });
    await harness.click(button('Continue'));
    await waitFor(() => expect(onFormEvent).toHaveBeenCalledWith({ type: 'field_error', fieldKey: 'name', error: expect.any(String) }));
    await harness.type(screen.getByRole('textbox', { name: /Name/ }), 'Ada');
    await harness.click(button('Continue'));
    await harness.click(await screen.findByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { name: 'Three' });
    await harness.click(button('Send'));
    await screen.findByText('Offline');
    expect(onFormEvent).toHaveBeenLastCalledWith({ type: 'form_submit_failed', reason: 'error' });
  });

  it('hides the summary once every error is fixed', async () => {
    harness.mount({ definition: wizard, errorSummary: true, onSubmit: () => {} });
    await harness.click(button('Continue'));
    await screen.findByRole('link', { name: 'Name: This field is required' });
    await harness.type(screen.getByRole('textbox', { name: /Name/ }), 'Ada');
    await waitFor(() => expect(document.querySelector('.fh-error-summary')).toBeNull());
  });
}
