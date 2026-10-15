import { deferred, filled, flat, wizard, type RendererHarness, type TestKit } from './fixtures';

export function stateScenarios(harness: RendererHarness, { it, expect, waitFor, screen, fn }: TestKit): void {
  const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
  const textbox = (name: string) => screen.getByRole('textbox', { name: new RegExp(name) }) as HTMLInputElement;
  const alerts = () => [...document.querySelectorAll('[role="alert"]')].map((alert) => alert.textContent?.trim());

  it('shows form errors and unknown field errors from the server above the actions', async () => {
    harness.mount({ definition: flat, onSubmit: () => ({ ok: false, errors: { ghost: 'Ghost field' }, formErrors: ['Try later'] }) });
    await harness.click(button('Send'));
    await screen.findByText('Try later');
    expect(alerts()).toEqual(['Try laterGhost field']);
    expect(document.querySelector('.fh-form__top-errors')).not.toBeNull();
  });

  it('shows the message of a failing submit handler', async () => {
    harness.mount({ definition: flat, onSubmit: () => { throw new Error('Offline'); } });
    await harness.click(button('Send'));
    await screen.findByText('Offline');
    expect(document.querySelector('form')?.getAttribute('aria-busy')).toBe('false');
  });

  it('links a field to its error', async () => {
    harness.mount({ definition: flat, errors: { first: 'Taken' }, onSubmit: () => {} });
    const error = await screen.findByText('Taken');
    const input = textbox('First');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(error.id);
    expect(textbox('Second').getAttribute('aria-invalid')).not.toBe('true');
  });

  it('disables the form while the loading prop is set', async () => {
    const onSubmit = fn();
    const mounted = harness.mount({ definition: flat, onSubmit });
    await mounted.update({ loading: true });
    expect(document.querySelector('form')?.getAttribute('aria-busy')).toBe('true');
    expect([button('Send').disabled, textbox('First').disabled]).toEqual([true, true]);
    await mounted.update({ loading: false });
    expect([button('Send').disabled, textbox('First').disabled]).toEqual([false, false]);
  });

  it('submits on the submit event of the form', async () => {
    const onSubmit = fn();
    harness.mount({ definition: flat, initialValues: { first: 'Ada' }, onSubmit });
    await harness.submit(document.querySelector('form')!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ first: 'Ada' }, []));
  });

  it('continues on the submit event of the form on a step', async () => {
    harness.mount({ definition: wizard, initialValues: filled, onSubmit: () => {} });
    await harness.submit(document.querySelector('form')!);
    await screen.findByRole('heading', { name: 'Two' });
  });

  it('focuses the first field of the previous step after Back', async () => {
    harness.mount({ definition: wizard, initialValues: filled, onSubmit: () => {} });
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Two' });
    await harness.click(button('Back'));
    await screen.findByRole('heading', { name: 'One' });
    await waitFor(() => expect(document.activeElement).toBe(textbox('Name')));
  });

  it('returns focus to the control used before a pending submission', async () => {
    const response = deferred<void>();
    harness.mount({ definition: flat, onSubmit: () => response.promise });
    const send = button('Send');
    send.focus();
    await harness.click(send);
    await waitFor(() => expect(send.disabled).toBe(true));
    send.blur();
    response.resolve();
    await waitFor(() => expect(send.disabled).toBe(false));
    await waitFor(() => expect(document.activeElement).toBe(send));
  });

  it('uses step and submit action settings', async () => {
    const onCancel = fn();
    const custom = { ...wizard, cancel: { label: 'Cancel' }, submit: { label: 'Send', disabled: [{ field: 'city', eq: 'Nowhere' }] }, steps: wizard.steps!.map((step) => (
      step.id === 'two' ? { ...step, next: { label: 'Pick later' }, back: false as const } : step
    )) };
    harness.mount({ definition: custom, initialValues: filled, onSubmit: () => {}, onCancel });
    await harness.click(button('Continue'));
    await harness.click(await screen.findByRole('button', { name: 'Pick later' }));
    await screen.findByRole('heading', { name: 'Three' });
    expect(button('Back')).toBeDefined();
    await harness.type(textbox('City'), 'Nowhere');
    expect(button('Send').disabled).toBe(true);
    await harness.click(button('Back'));
    await screen.findByRole('heading', { name: 'Two' });
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    await harness.click(button('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
}
