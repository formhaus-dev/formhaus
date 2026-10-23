import type { FormDefinition, SubmitResult } from '../../src';
import { deferred, filled, wizard, type RendererHarness, type TestKit } from './fixtures';

const kids: FormDefinition = {
  id: 'kids',
  title: '',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
    {
      id: 'two',
      title: 'Two',
      fields: [
        { key: 'kids', type: 'group', label: 'Kids', defaultItems: 1, fields: [{ key: 'kid', type: 'text', label: 'Kid name' }] },
        { key: 'pet', type: 'text', label: 'Pet', show: [{ field: 'name', eq: 'Rex' }] },
      ],
    },
  ],
};

export function handleScenarios(harness: RendererHarness, { it, expect, waitFor, screen }: TestKit): void {
  const textbox = (name: string) => screen.getByRole('textbox', { name: new RegExp(name) });
  const heading = (name: string) => screen.findByRole('heading', { name });
  const send = () => harness.click(screen.getByRole('button', { name: 'Send' }));

  it('shows a field on another step and reads the errors through the handle', async () => {
    const form = harness.mount({
      definition: wizard,
      initialValues: filled,
      onSubmit: () => ({ ok: false, errors: { name: 'Taken', coupon: 'Server down' } }),
    });
    expect(form.handle().getErrors()).toEqual({ groups: [], topLevelErrors: [], count: 0 });

    form.handle().showField('city');
    await heading('Three');
    await waitFor(() => expect(document.activeElement).toBe(textbox('City')));

    await send();
    await heading('One');
    const { groups, topLevelErrors, count } = form.handle().getErrors();
    expect(groups.map(({ id, title, entries }) => [id, title, entries.map(({ key, text }) => [key, text])])).toEqual([
      ['one', 'One', [['name', 'Name: Taken']]],
    ]);
    expect([topLevelErrors, count]).toEqual([['Server down'], 1]);
    expect(document.getElementById(groups[0].entries[0].id)).toBe(textbox('Name'));

    form.handle().showField('city');
    await heading('Three');
    await waitFor(() => expect(document.activeElement).toBe(textbox('City')));
  });

  it('resolves a group item entry id in the DOM and ignores unknown and hidden keys', async () => {
    const form = harness.mount({ definition: kids, onSubmit: () => ({ ok: false, errors: { 'kids.0.kid': 'Too short' } }) });
    form.handle().showField('nope');
    form.handle().showField('pet');
    await heading('One');
    form.handle().showField('kids.0.kid');
    await heading('Two');
    await send();
    const [entry] = form.handle().getErrors().groups[0].entries;
    expect([entry.key, entry.text]).toEqual(['kids.0.kid', 'Kid name (Kids 1): Too short']);
    expect(document.getElementById(entry.id)).toBe(textbox('Kid name'));
  });

  it('adds the error of a failed action to the top-level errors', async () => {
    const form = harness.mount({
      definition: kids,
      initialValues: { name: 'Ada' },
      onSubmit: () => {
        throw new Error('Network down');
      },
    });
    form.handle().showField('kids.0.kid');
    await heading('Two');
    await send();
    await screen.findByText('Network down');
    expect(form.handle().getErrors().topLevelErrors).toEqual(['Network down']);
  });

  it('does not cancel a pending submit', async () => {
    const response = deferred<SubmitResult>();
    const form = harness.mount({ definition: wizard, initialValues: filled, onSubmit: () => response.promise });
    form.handle().showField('city');
    await heading('Three');
    await send();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' }).getAttribute('aria-busy')).toBe('true'));
    form.handle().showField('name');
    await new Promise((done) => setTimeout(done));
    expect(screen.queryByRole('heading', { name: 'One' })).toBeNull();
    response.resolve({ ok: false, formErrors: ['Server said no'] });
    await screen.findByText('Server said no');
    expect(screen.getByRole('heading', { name: 'Three' })).toBeTruthy();
  });

  it('does not cancel a pending step check', async () => {
    const check = deferred<Record<string, string> | null>();
    const form = harness.mount({ definition: wizard, initialValues: filled, onSubmit: () => {}, onStepValidate: () => check.promise });
    await harness.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect((screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(true));
    form.handle().showField('city');
    check.resolve(null);
    await heading('Two');
  });
}
