import { filled, wizard, type RendererHarness, type TestKit } from './fixtures';

export function handleScenarios(harness: RendererHarness, { it, expect, waitFor, screen }: TestKit): void {
  const textbox = (name: string) => screen.getByRole('textbox', { name: new RegExp(name) });

  it('shows a field on another step and reads the errors through the handle', async () => {
    const form = harness.mount({
      definition: wizard,
      initialValues: filled,
      onSubmit: () => ({ ok: false, errors: { name: 'Taken', coupon: 'Server down' } }),
    });
    expect(form.handle().getErrors()).toEqual({ groups: [], topLevelErrors: [], count: 0 });

    form.handle().showField('city');
    await screen.findByRole('heading', { name: 'Three' });
    await waitFor(() => expect(document.activeElement).toBe(textbox('City')));

    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByRole('heading', { name: 'One' });
    const { groups, topLevelErrors, count } = form.handle().getErrors();
    expect(groups.map(({ id, title, entries }) => [id, title, entries.map(({ key, text }) => [key, text])])).toEqual([
      ['one', 'One', [['name', 'Name: Taken']]],
    ]);
    expect([topLevelErrors, count]).toEqual([['Server down'], 1]);
    expect(document.getElementById(groups[0].entries[0].id)).toBe(textbox('Name'));

    form.handle().showField('city');
    await screen.findByRole('heading', { name: 'Three' });
    await waitFor(() => expect(document.activeElement).toBe(textbox('City')));
  });
}
