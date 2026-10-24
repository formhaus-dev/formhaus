import type { FormDefinition } from '../../src';
import type { RendererHarness, TestKit } from './fixtures';

const options = (...values: string[]) => values.map((value) => ({ value, label: value.toUpperCase() }));

const allTypes: FormDefinition = {
  id: 'all',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name', helperText: 'Full name', validation: { required: true } },
    { key: 'age', type: 'number', label: 'Age' },
    { key: 'secret', type: 'password', label: 'Secret' },
    { key: 'born', type: 'date', label: 'Born' },
    { key: 'pick', type: 'select', label: 'Pick', options: options('a', 'b') },
    { key: 'tags', type: 'multiselect', label: 'Tags', options: options('x', 'y') },
    { key: 'agree', type: 'checkbox', label: 'Agree' },
    { key: 'plan', type: 'radio', label: 'Plan', helperText: 'One plan', options: options('basic', 'pro'), validation: { required: true } },
    { key: 'score', type: 'scale', label: 'Score', validation: { min: 1, max: 3 } },
  ],
};

export function mapControlScenarios(harness: RendererHarness, { it, expect, fn, waitFor, screen }: TestKit): void {
  const mapped = harness.mapped!;
  const root = (element: Element) => element.closest('[data-fh="field"]')!;
  const labelsFor = (id: string) => [...document.querySelectorAll('label')].filter((label) => label.htmlFor === id).length;
  const send = () => harness.click(screen.getByRole('button', { name: 'Send' }));
  const pickTag = async (name: string) => {
    const select = screen.getByRole('listbox', { name: 'Tags' }) as HTMLSelectElement;
    for (const option of select.options) option.selected = option.value === name;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await waitFor(() => expect(select.value).toBe(name));
  };

  it('passes ids, names, ARIA and the native type, and renders one label per control through the shell', async () => {
    harness.mount({ definition: allTypes, components: mapped.shell, onSubmit: fn() });
    const name = screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement;
    expect([name.id.endsWith('-name'), name.name, name.type, name.getAttribute('aria-required')]).toEqual([true, 'name', 'text', 'true']);
    expect(name.getAttribute('aria-describedby')).toBe(`${name.id}-helper`);
    expect(document.getElementById(`${name.id}-helper`)?.textContent).toBe('Full name');
    expect(root(name).getAttribute('data-kind')).toBe('input');
    expect((screen.getByRole('spinbutton', { name: 'Age' }) as HTMLInputElement).type).toBe('number');
    expect(screen.getByLabelText('Secret').hasAttribute('type')).toBe(false);
    expect(screen.getByLabelText('Pick').getAttribute('list')).toBe('a,b');
    const agree = screen.getByRole('checkbox', { name: 'Agree' });
    expect(root(agree).getAttribute('data-kind')).toBe('inline');
    const plan = screen.getByRole('group', { name: 'Plan' });
    expect([plan.tagName, plan.getAttribute('data-fh'), plan.getAttribute('aria-describedby')]).toEqual([
      'FIELDSET',
      'field',
      `${name.id.replace(/name$/, 'plan')}-helper`,
    ]);
    expect(screen.getAllByRole('radiogroup')[0].id).toBe(name.id.replace(/name$/, 'plan'));
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual(['basic', 'pro', '1', '2', '3']);
    for (const id of [name.id, agree.id, screen.getByLabelText('Born').id]) expect(labelsFor(id)).toBe(1);
  });

  it('marks errors on the control and on the group root', async () => {
    harness.mount({ definition: allTypes, components: mapped.shell, onSubmit: fn() });
    await send();
    const name = screen.getByRole('textbox', { name: 'Name' });
    await waitFor(() => expect(name.getAttribute('aria-invalid')).toBe('true'));
    expect(name.getAttribute('aria-describedby')).toBe(`${name.id}-helper ${name.id}-error`);
    const plan = screen.getByRole('group', { name: 'Plan' });
    expect(plan.getAttribute('aria-invalid')).toBe('true');
    expect(plan.getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
  });

  it('submits the value formats core expects from events, bare values and option objects', async () => {
    const onSubmit = fn();
    harness.mount({ definition: allTypes, components: mapped.shell, onSubmit });
    await harness.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada');
    await harness.type(screen.getByRole('spinbutton', { name: 'Age' }), '42');
    await harness.type(screen.getByLabelText('Secret'), 'pw');
    await harness.type(screen.getByLabelText('Born'), '2026-01-05');
    await harness.type(screen.getByLabelText('Pick'), 'b');
    await pickTag('y');
    await harness.click(screen.getByRole('checkbox', { name: 'Agree' }));
    await harness.click(screen.getByRole('radio', { name: 'PRO' }));
    await harness.click(screen.getByRole('radio', { name: '2' }));
    await send();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({
      name: 'Ada',
      age: 42,
      secret: 'pw',
      born: '2026-01-05',
      pick: 'b',
      tags: ['y'],
      agree: true,
      plan: 'pro',
      score: 2,
    });
  });

  it('writes null for an empty number and keeps the shown text of a value', async () => {
    const onSubmit = fn();
    harness.mount({ definition: allTypes, components: mapped.shell, initialValues: { name: 'Ada', age: 7, plan: 'basic' }, onSubmit });
    const age = screen.getByRole('spinbutton', { name: 'Age' }) as HTMLInputElement;
    expect(age.value).toBe('7');
    expect((screen.getByRole('radio', { name: 'BASIC' }) as HTMLInputElement).checked).toBe(true);
    await harness.type(age, '');
    await send();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: 'Ada', age: null, plan: 'basic' });
  });

  it('gives the control the labels props and no describedby when the shell is null', async () => {
    harness.mount({ definition: allTypes, components: mapped.bare, onSubmit: fn() });
    const name = screen.getByRole('textbox', { name: 'Name' });
    expect([labelsFor(name.id), name.hasAttribute('aria-describedby'), root(name).tagName]).toEqual([1, false, 'DIV']);
    expect(screen.queryByRole('group', { name: 'Plan' })).toBeNull();
    const plan = screen.getByRole('radiogroup', { name: 'Plan' });
    expect(root(plan).tagName).toBe('DIV');
    expect(labelsFor(screen.getByRole('checkbox', { name: 'Agree' }).id)).toBe(1);
    await send();
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name' }).getAttribute('aria-invalid')).toBe('true'));
    expect([root(plan).hasAttribute('aria-invalid'), root(plan).hasAttribute('aria-describedby')]).toEqual([false, false]);
  });

  it('takes a shell per kind and treats a missing kind as null', () => {
    harness.mount({ definition: allTypes, components: mapped.mixed, onSubmit: fn() });
    expect(screen.getByRole('group', { name: 'Plan' }).tagName).toBe('FIELDSET');
    const name = screen.getByRole('textbox', { name: 'Name' });
    expect([labelsFor(name.id), root(name).hasAttribute('data-kind')]).toEqual([1, false]);
  });

  it('disables the controls while the renderer is loading', () => {
    harness.mount({ definition: allTypes, components: mapped.shell, loading: true, onSubmit: fn() });
    expect((screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getAllByRole('radio').every((radio) => (radio as HTMLInputElement).disabled)).toBe(true);
    expect((screen.getByRole('checkbox', { name: 'Agree' }) as HTMLInputElement).disabled).toBe(true);
  });

  it('mixes with hand-written components and keeps built-ins for unmapped types', () => {
    harness.mount({
      definition: {
        id: 'mix',
        title: '',
        submit: { label: 'Send' },
        fields: [
          { key: 'first', type: 'text', label: 'First' },
          { key: 'mail', type: 'email', label: 'Mail' },
          { key: 'when', type: 'time', label: 'When' },
          { key: 'file', type: 'file', label: 'File' },
        ],
      },
      components: { ...mapped.shell, text: harness.controls!['x-text'] },
      onSubmit: fn(),
    });
    expect(screen.getByRole('textbox', { name: 'First' }).closest('[data-kind]')).toBeNull();
    const mail = screen.getByRole('textbox', { name: 'Mail' }) as HTMLInputElement;
    expect([root(mail).getAttribute('data-kind'), mail.type]).toEqual(['input', 'email']);
    expect((screen.getByLabelText('When') as HTMLInputElement).type).toBe('time');
    expect(screen.getByLabelText('File').closest('.fh-field')).not.toBeNull();
  });

  const warnings = async (components: Record<string, unknown>) => {
    const warn = console.warn;
    const calls: string[] = [];
    console.warn = (message: unknown) => void calls.push(String(message));
    try {
      harness.mount({ definition: allTypes, components, onSubmit: fn() });
      await waitFor(() => expect(document.querySelector('[name="name"]')).not.toBeNull());
      await new Promise((done) => setTimeout(done, 10));
      return calls.filter((message) => message.includes('double-label'));
    } finally {
      console.warn = warn;
    }
  };

  it('warns in development when a field gets two labels', async () => {
    const found = await warnings(mapped.doubled);
    expect(['name', 'age', 'secret', 'born'].map((key) => found.filter((message) => message.includes(`-${key}"`)).length)).toEqual([
      1, 1, 1, 1,
    ]);
  });

  it('does not warn with one label per control', async () => {
    expect(await warnings(mapped.shell)).toEqual([]);
  });

  it('renders the matrix component for matrix rows', () => {
    harness.mount({
      definition: {
        formatVersion: '1.6',
        id: 'matrix',
        title: '',
        submit: { label: 'Send' },
        fields: [
          {
            key: 'rates',
            type: 'section',
            title: 'Rates',
            layout: 'matrix',
            fields: [
              { key: 'speed', type: 'radio', label: 'Speed', options: options('a', 'b') },
              { key: 'price', type: 'radio', label: 'Price', options: options('a', 'b') },
            ],
          },
          { key: 'plan', type: 'radio', label: 'Plan', options: options('basic', 'pro') },
        ],
      },
      components: mapped.shell,
      onSubmit: fn(),
    });
    expect([...document.querySelectorAll('[data-row]')].map((row) => row.textContent)).toEqual(['Speed', 'Price']);
    expect(screen.getByRole('group', { name: 'Plan' })).toBeDefined();
  });
}
