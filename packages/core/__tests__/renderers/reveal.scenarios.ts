import type { FormDefinition } from '../../src';
import type { RendererHarness, TestKit } from './fixtures';

const options = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'post', label: 'Post' },
];

const contact: FormDefinition = {
  id: 'contact',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'contact', type: 'radio', label: 'Contact', options },
    { key: 'email', type: 'text', label: 'Email address', show: [{ field: 'contact', eq: 'email' }], validation: { required: true } },
    { key: 'phone', type: 'text', label: 'Phone number', show: [{ field: 'contact', eq: 'phone' }] },
    { key: 'note', type: 'text', label: 'Note', validation: { required: true } },
  ],
};

const channels: FormDefinition = {
  ...contact,
  fields: [
    { key: 'channels', type: 'multiselect', label: 'Channels', options },
    { key: 'email', type: 'text', label: 'Email address', show: [{ field: 'channels', contains: 'email' }] },
    { key: 'post', type: 'text', label: 'Postal address', show: [{ field: 'channels', contains: 'post' }] },
  ],
};

export function revealScenarios(harness: RendererHarness, { it, expect, waitFor, screen }: TestKit): void {
  const textbox = (name: string) => screen.getByRole('textbox', { name: new RegExp(name) });
  const radio = (name: string) => screen.getByRole('radio', { name });
  const before = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  const container = (input: Element) => document.getElementById(input.getAttribute('aria-controls')!);

  it('keeps fields after the option group without conditionalReveal', async () => {
    harness.mount({ definition: contact, initialValues: { contact: 'email' }, onSubmit: () => {} });
    expect(radio('Email').closest('fieldset')?.contains(textbox('Email address'))).toBe(false);
    expect(radio('Email').hasAttribute('aria-controls')).toBe(false);
  });

  it('nests a revealed field under its radio option', async () => {
    harness.mount({ definition: contact, conditionalReveal: true, onSubmit: () => {} });
    const email = radio('Email');
    const reveal = container(email)!;
    expect(reveal.hidden).toBe(true);
    expect(reveal.className).toBe('fh-field__reveal');
    expect(email.hasAttribute('aria-expanded')).toBe(false);
    expect(radio('Post').hasAttribute('aria-controls')).toBe(false);
    await harness.click(email);
    await waitFor(() => expect(reveal.hidden).toBe(false));
    expect(reveal.contains(textbox('Email address'))).toBe(true);
    expect(before(textbox('Email address'), radio('Phone'))).toBe(true);
    expect(before(textbox('Email address'), textbox('Note'))).toBe(true);
    expect(email.closest('fieldset')?.contains(textbox('Note'))).toBe(false);
    await harness.click(radio('Phone'));
    await waitFor(() => expect(container(radio('Phone'))?.contains(textbox('Phone number'))).toBe(true));
    expect(screen.queryByRole('textbox', { name: /Email address/ })).toBeNull();
    expect(reveal.hidden).toBe(true);
  });

  it('sets aria-expanded on checkbox options and nests every checked option', async () => {
    harness.mount({ definition: channels, conditionalReveal: true, initialValues: { channels: ['email', 'post'] }, onSubmit: () => {} });
    const email = screen.getByRole('checkbox', { name: 'Email' });
    expect(email.getAttribute('aria-expanded')).toBe('true');
    expect(container(email)?.contains(textbox('Email address'))).toBe(true);
    expect(container(screen.getByRole('checkbox', { name: 'Post' }))?.contains(textbox('Postal address'))).toBe(true);
    await harness.click(email);
    await waitFor(() => expect(email.getAttribute('aria-expanded')).toBe('false'));
    expect(screen.getByRole('checkbox', { name: 'Phone' }).hasAttribute('aria-expanded')).toBe(false);
  });

  it('lists errors in visual order and focuses a nested field from the summary', async () => {
    harness.mount({ definition: contact, conditionalReveal: true, initialValues: { contact: 'email' }, onSubmit: () => {} });
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    const links = await waitFor(() => {
      const found = screen.getAllByRole('link');
      expect(found).toHaveLength(2);
      return found;
    });
    expect(links.map((link) => link.textContent)).toEqual(['Email address: This field is required', 'Note: This field is required']);
    textbox('Note').focus();
    await harness.click(links[0]);
    await waitFor(() => expect(document.activeElement).toBe(textbox('Email address')));
  });

  it('shows the error of the parent above its nested fields', async () => {
    harness.mount({
      definition: contact,
      conditionalReveal: true,
      initialValues: { contact: 'email', email: 'a@b.c', note: 'Hi' },
      onSubmit: () => ({ ok: false, errors: { contact: 'Pick another way' } }),
    });
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    const error = await screen.findByText('Pick another way');
    expect(before(error, radio('Email'))).toBe(true);
    expect(before(error, textbox('Email address'))).toBe(true);
  });

  it('nests inside a section and nests a revealed radio with its own field', async () => {
    const definition: FormDefinition = {
      ...contact,
      fields: [
        {
          key: 'about',
          type: 'section',
          title: 'About',
          fields: [
            {
              key: 'kids',
              type: 'radio',
              label: 'Kids',
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
            },
            { key: 'ages', type: 'radio', label: 'Ages', show: [{ field: 'kids', eq: 'yes' }], options: [{ value: 'old', label: 'Old' }] },
            { key: 'detail', type: 'text', label: 'Detail', show: [{ field: 'ages', eq: 'old' }] },
          ],
        },
      ],
    };
    harness.mount({ definition, conditionalReveal: true, initialValues: { kids: 'yes', ages: 'old' }, onSubmit: () => {} });
    const outer = container(radio('Yes'))!;
    expect(outer.contains(radio('Old'))).toBe(true);
    expect(container(radio('Old'))?.contains(textbox('Detail'))).toBe(true);
    expect(outer.contains(textbox('Detail'))).toBe(true);
  });

  it('keeps the flat layout for a custom radio component', async () => {
    harness.mount({
      definition: contact,
      conditionalReveal: true,
      components: { radio: harness.controls!['x-pick'] },
      initialValues: { contact: 'email' },
      onSubmit: () => {},
    });
    expect(screen.getByRole('radiogroup').contains(textbox('Email address'))).toBe(false);
  });

  it('passes revealed fields to mapControls adapters that render them', async () => {
    harness.mount({
      definition: contact,
      conditionalReveal: true,
      components: harness.mapped!.revealed,
      initialValues: { contact: 'email' },
      onSubmit: () => {},
    });
    const reveal = container(radio('Email'))!;
    expect(reveal.contains(textbox('Email address'))).toBe(true);
    expect(screen.getByRole('radiogroup').contains(textbox('Note'))).toBe(false);
    await harness.type(textbox('Email address'), 'a@b.c');
    await waitFor(() => expect((textbox('Email address') as HTMLInputElement).value).toBe('a@b.c'));
    expect(radio('Email')).toHaveProperty('checked', true);
  });

  it('keeps the flat layout in mapControls without conditionalReveal types', async () => {
    harness.mount({
      definition: contact,
      conditionalReveal: true,
      components: harness.mapped!.shell,
      initialValues: { contact: 'email' },
      onSubmit: () => {},
    });
    expect(screen.getByRole('radiogroup').contains(textbox('Email address'))).toBe(false);
  });
}
