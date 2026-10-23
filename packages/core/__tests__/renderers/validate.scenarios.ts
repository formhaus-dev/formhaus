import { filled, wizard, type RendererHarness, type TestKit } from './fixtures';

export function validateScenarios(harness: RendererHarness, { it, expect, waitFor, screen, fn }: TestKit): void {
  const button = (name: string) => screen.getByRole('button', { name });
  const textbox = (name: string) => screen.getByRole('textbox', { name: new RegExp(name) });

  it('shows onValidate errors of the step and focuses the field', async () => {
    const onValidate = fn(async () => ({ name: 'Taken' }));
    harness.mount({ definition: wizard, initialValues: filled, onSubmit: () => {}, onValidate });
    await harness.click(button('Continue'));
    await screen.findByText('Taken');
    expect(onValidate).toHaveBeenCalledWith(filled, { stepId: 'one', fields: ['name'], submit: false });
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
    expect(onValidate).toHaveBeenLastCalledWith(filled, { stepId: 'three', fields: ['name', 'plan', 'city'], submit: true });
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
}
