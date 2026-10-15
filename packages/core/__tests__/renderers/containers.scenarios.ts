import type { FormDefinition } from '../../src';
import type { RendererHarness, TestKit } from './fixtures';

const event: FormDefinition = {
  formatVersion: '1.1',
  id: 'event',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'company', type: 'checkbox', label: 'Company' },
    {
      key: 'billing',
      type: 'section',
      title: 'Billing',
      description: 'For invoices',
      show: [{ field: 'company', eq: true }],
      fields: [{ key: 'street', type: 'text', label: 'Street' }],
    },
    {
      key: 'people',
      type: 'group',
      label: 'People',
      itemLabel: 'Person {index}',
      addLabel: 'Add person',
      defaultItems: 1,
      validation: { required: true, maxLength: 2 },
      fields: [
        { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
        {
          key: 'plan',
          type: 'radio',
          label: 'Plan',
          options: [
            { value: 'a', label: 'Plan A' },
            { value: 'b', label: 'Plan B' },
          ],
        },
        { key: 'note', type: 'text', label: 'Note', show: [{ field: 'plan', eq: 'b' }] },
      ],
    },
  ],
};

const team: FormDefinition = {
  ...event,
  id: 'team',
  fields: [
    { key: 'crew', type: 'group', label: 'Crew', validation: { minLength: 2 }, fields: [{ key: 'name', type: 'text', label: 'Name' }] },
  ],
};

export function containerScenarios(harness: RendererHarness, { it, expect, waitFor, screen, fn }: TestKit): void {
  const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
  const names = () => screen.queryAllByRole('textbox', { name: /^Name/ }) as HTMLInputElement[];
  const active = () => document.activeElement;
  const status = () => document.querySelector('.fh-group__status')?.textContent;

  it('renders a section as a fieldset with a legend and hides it with its condition', async () => {
    harness.mount({ definition: event, onSubmit: () => {} });
    expect(screen.queryByRole('group', { name: 'Billing' })).toBeNull();
    await harness.click(screen.getByRole('checkbox', { name: 'Company' }));
    const section = await screen.findByRole('group', { name: 'Billing' });
    expect(section.tagName).toBe('FIELDSET');
    expect(
      section.getAttribute('aria-describedby') && document.getElementById(section.getAttribute('aria-describedby')!)?.textContent,
    ).toBe('For invoices');
    expect(screen.getByRole('textbox', { name: 'Street' })).toBeDefined();
  });

  it('adds an item, focuses its first field and announces it', async () => {
    harness.mount({ definition: event, onSubmit: () => {} });
    expect(screen.getByRole('group', { name: 'Person 1' })).toBeDefined();
    expect(screen.queryByRole('button', { name: /^Remove/ })).toBeNull();
    await harness.click(button('Add person'));
    await screen.findByRole('group', { name: 'Person 2' });
    await waitFor(() => expect(active()).toBe(names()[1]));
    expect(status()).toBe('Person 2 added');
    expect(screen.queryByRole('button', { name: 'Add person' })).toBeNull();
    expect(button('Remove Person 1')).toBeDefined();
  });

  it('removes an item, moves focus to the next item and announces it', async () => {
    harness.mount({ definition: event, initialValues: { people: [{ name: 'Ada' }, { name: 'Bo' }] }, onSubmit: () => {} });
    await harness.click(button('Remove Person 1'));
    await harness.click(await screen.findByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(names().map((input) => input.value)).toEqual(['Bo']));
    await waitFor(() => expect(active()?.textContent).toBe('Person 1'));
    expect(status()).toBe('Person 1 removed');
  });

  it('moves focus to Add after the last item is removed', async () => {
    harness.mount({ definition: team, initialValues: { crew: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] }, onSubmit: () => {} });
    await harness.click(button('Remove Crew 3'));
    await harness.click(await screen.findByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(active()).toBe(button('Add')));
  });

  it('keeps radio groups of items apart and shows item fields by item conditions', async () => {
    harness.mount({ definition: event, initialValues: { people: [{ name: 'A' }, { name: 'B' }] }, onSubmit: () => {} });
    const radios = screen.getAllByRole('radio', { name: 'Plan B' }) as HTMLInputElement[];
    expect(radios[0].name).not.toBe(radios[1].name);
    await harness.click(radios[1]);
    await screen.findByRole('textbox', { name: 'Note' });
    expect(screen.getAllByRole('textbox', { name: 'Note' })).toHaveLength(1);
    expect((screen.getAllByRole('radio', { name: 'Plan B' })[0] as HTMLInputElement).checked).toBe(false);
  });

  it('submits items as an array of objects', async () => {
    const onSubmit = fn();
    harness.mount({ definition: event, onSubmit });
    await harness.type(names()[0], ' Ada ');
    await harness.click(button('Add person'));
    await waitFor(() => expect(names()).toHaveLength(2));
    await harness.type(names()[1], 'Bo');
    await harness.click(button('Send'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ people: [{ name: 'Ada' }, { name: 'Bo' }] }, []));
  });

  it('shows item errors, focuses the first invalid item field and links it from the summary', async () => {
    harness.mount({ definition: event, initialValues: { people: [{ name: 'Ada' }, {}] }, errorSummary: true, onSubmit: () => {} });
    await harness.click(button('Send'));
    const link = await screen.findByRole('link', { name: 'Name (Person 2): This field is required' });
    await waitFor(() => expect(active()).toBe(names()[1]));
    expect(names()[1].getAttribute('aria-invalid')).toBe('true');
    names()[0].focus();
    await harness.click(link);
    await waitFor(() => expect(active()).toBe(names()[1]));
  });

  it('maps server errors to item fields and focuses Add for a count error', async () => {
    harness.mount({ definition: team, initialValues: { crew: [{ name: 'A' }] }, errorSummary: true, onSubmit: () => {} });
    await harness.click(button('Send'));
    await screen.findByText('Must be at least 2 items');
    await waitFor(() => expect(active()).toBe(button('Add')));
    expect(screen.getByRole('group', { name: 'Crew' }).getAttribute('aria-invalid')).toBe('true');
  });

  it('applies server errors by path', async () => {
    harness.mount({
      definition: event,
      initialValues: { people: [{ name: 'Ada' }, { name: 'Bo' }] },
      onSubmit: () => ({ ok: false, errors: { 'people.1.name': 'Taken' } }),
    });
    await harness.click(button('Send'));
    await screen.findByText('Taken');
    await waitFor(() => expect(active()).toBe(names()[1]));
  });

  it('renders sections and groups through custom components', async () => {
    const onSubmit = fn();
    harness.mount({ definition: event, components: harness.containers, initialValues: { company: true }, onSubmit });
    expect(screen.getByRole('heading', { name: 'Billing' })).toBeDefined();
    expect(document.querySelector('.fh-group')).toBeNull();
    expect(screen.getByText('People: 1')).toBeDefined();
    await harness.click(button('More'));
    await screen.findByText('People: 2');
    expect(screen.getAllByRole('textbox', { name: /^Name/ })).toHaveLength(2);
    expect(button('More').disabled).toBe(true);
    await harness.click(button('Drop Person 1'));
    await screen.findByText('People: 1');
    await harness.type(names()[0], 'Ada');
    await harness.click(button('Send'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ company: true, people: [{ name: 'Ada' }] }, []));
  });

  it('keeps focus and the same input while typing in sections and group items', async () => {
    harness.mount({ definition: event, initialValues: { company: true }, onSubmit: () => {} });
    const typeInto = async (find: () => HTMLInputElement, text: string) => {
      const input = find();
      input.focus();
      for (let end = 1; end <= text.length; end++) {
        await harness.type(input, text.slice(0, end));
        await waitFor(() => expect(find().value).toBe(text.slice(0, end)));
        expect(find()).toBe(input);
        expect(active()).toBe(input);
      }
    };
    await typeInto(() => screen.getByRole('textbox', { name: 'Street' }) as HTMLInputElement, 'Main');
    await typeInto(() => names()[0], 'Ada');
    await harness.click(button('Add person'));
    await waitFor(() => expect(names()).toHaveLength(2));
    await typeInto(() => names()[1], 'Bo');
    await harness.click(button('Remove Person 1'));
    await harness.click(await screen.findByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(names()).toHaveLength(1));
    await typeInto(() => names()[0], 'Bob');
  });

  it('asks before removing a filled item and keeps it on Escape or Cancel', async () => {
    harness.mount({ definition: event, initialValues: { people: [{ name: 'Ada' }, {}] }, onSubmit: () => {} });
    await harness.click(button('Remove Person 1'));
    const prompt = await waitFor(() => document.querySelector('.fh-group__prompt')!);
    expect(prompt.textContent).toBe('Remove Person 1 and its answers?');
    await waitFor(() => expect(active()).toBe(button('Remove')));
    expect(status()).toBe('Remove Person 1 and its answers?');
    active()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await waitFor(() => expect(prompt.isConnected).toBe(false));
    await waitFor(() => expect(active()).toBe(button('Remove Person 1')));
    await harness.click(button('Remove Person 1'));
    await harness.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(active()).toBe(button('Remove Person 1')));
    expect(names().map((input) => input.value)).toEqual(['Ada', '']);
    await harness.click(button('Remove Person 2'));
    await waitFor(() => expect(names().map((input) => input.value)).toEqual(['Ada']));
    expect(screen.queryByText(/and its answers/)).toBeNull();
  });

  it('removes filled items at once when confirmRemove is false', async () => {
    harness.mount({
      definition: event,
      confirmRemove: false,
      initialValues: { people: [{ name: 'Ada' }, { name: 'Bo' }] },
      onSubmit: () => {},
    });
    await harness.click(button('Remove Person 1'));
    await waitFor(() => expect(names().map((input) => input.value)).toEqual(['Bo']));
  });
}
