import type { FormDefinition } from '../../src';
import type { RendererHarness, TestKit } from './fixtures';

const contacts: FormDefinition = {
  id: 'contacts',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'contact.email', type: 'text', label: 'Work email', validation: { required: true } },
    { key: 'contact-email', type: 'text', label: 'Home email' },
    { key: 'name', type: 'text', label: 'Name' },
  ],
};

const KEYS = ['contact.email', 'first-name', 'last_name', 'field2', 'camelCase', 'имя', 'Größe'];
const unusual: FormDefinition = {
  id: 'keys',
  title: '',
  submit: { label: 'Send' },
  fields: KEYS.map((key) => ({ key, type: 'text', label: `Label ${key}` })),
};

export function idScenarios(harness: RendererHarness, { it, expect, waitFor, screen, fn }: TestKit): void {
  const input = (name: RegExp) => screen.getByRole('textbox', { name }) as HTMLInputElement;
  const byKey = (key: string) => input(new RegExp(`^Label ${key.replace(/\./g, '\\.')}`));
  const errorOf = (key: string) => document.getElementById(`${byKey(key).id}-error`)?.textContent;

  it('gives each field its own id when two keys escape to the same id', async () => {
    harness.mount({ definition: contacts, errorSummary: true, onSubmit: fn() });
    const work = input(/^Work email/);
    const home = input(/^Home email/);
    expect(work.id).not.toBe(home.id);
    expect(home.id).toMatch(/-contact-email$/);
    expect(input(/^Name/).id).toMatch(/-name$/);
    expect(document.querySelectorAll(`[id="${work.id}"]`)).toHaveLength(1);
    expect(document.querySelectorAll(`[id="${home.id}"]`)).toHaveLength(1);
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    const link = await waitFor(() => document.querySelector('.fh-error-summary__link') as HTMLAnchorElement);
    expect(link.getAttribute('href')).toBe(`#${work.id}`);
    expect(work.getAttribute('aria-describedby')).toContain(`${work.id}-error`);
    home.focus();
    await harness.click(link);
    await waitFor(() => expect(document.activeElement).toBe(work));
  });

  it('submits values under each key exactly as written', async () => {
    const onSubmit = fn();
    harness.mount({ definition: unusual, onSubmit });
    for (const key of KEYS) await harness.type(byKey(key), `value of ${key}`);
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual(Object.fromEntries(KEYS.map((key) => [key, `value of ${key}`])));
  });

  it('shows a server error next to the field with the same key', async () => {
    harness.mount({ definition: unusual, errors: { 'contact.email': 'Already registered', имя: 'Too short' }, onSubmit: fn() });
    await waitFor(() => expect(byKey('contact.email').getAttribute('aria-invalid')).toBe('true'));
    expect(errorOf('contact.email')).toContain('Already registered');
    expect(errorOf('имя')).toContain('Too short');
    expect(byKey('first-name').getAttribute('aria-invalid')).not.toBe('true');
  });

  const unique = () => {
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  };

  it('gives item fields their own ids when two keys escape to the same id', async () => {
    harness.mount({ definition: crew, initialValues: { crew: [{}] }, errorSummary: true, onSubmit: fn() });
    const work = input(/^Work email/);
    const home = input(/^Home email/);
    expect(work.id).not.toBe(home.id);
    unique();
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    const links = await waitFor(() => {
      const found = [...document.querySelectorAll<HTMLAnchorElement>('.fh-error-summary__link')];
      expect(found).toHaveLength(2);
      return found;
    });
    expect(links.map((link) => link.getAttribute('href'))).toEqual([`#${work.id}`, `#${home.id}`]);
    expect(document.getElementById(`${home.id}-error`)?.textContent).toContain('required');
    await waitFor(() => expect(document.activeElement).toBe(work));
    await harness.click(links[1]);
    await waitFor(() => expect(document.activeElement).toBe(home));
  });

  it('keeps section ids apart from field ids', () => {
    harness.mount({ definition: sectioned, onSubmit: fn() });
    expect(screen.getByRole('group', { name: 'Contact' })).toBeDefined();
    expect(input(/^Home email/).id).toMatch(/-contact-email$/);
    unique();
  });
}

const crew: FormDefinition = {
  formatVersion: '1.1',
  id: 'crew',
  title: '',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'crew',
      type: 'group',
      label: 'Crew',
      fields: [
        { key: 'contact.email', type: 'text', label: 'Work email', validation: { required: true } },
        { key: 'contact-email', type: 'text', label: 'Home email', validation: { required: true } },
      ],
    },
  ],
};

const sectioned: FormDefinition = {
  formatVersion: '1.1',
  id: 'sectioned',
  title: '',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'contact.email',
      type: 'section',
      title: 'Contact',
      description: 'How to reach you',
      fields: [{ key: 'phone', type: 'text', label: 'Phone' }],
    },
    { key: 'contact-email', type: 'text', label: 'Home email' },
  ],
};
