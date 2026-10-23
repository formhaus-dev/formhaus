import type { DefinitionIssue, FormDefinition } from '../../src';
import type { RendererHarness, TestKit } from './fixtures';

const options = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];

const survey: FormDefinition = {
  formatVersion: '1.6',
  id: 'survey',
  title: '',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'about',
      title: 'About',
      fields: [
        { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
        { key: 'email', type: 'email', label: 'Email', validation: { required: true } },
        {
          key: 'rates',
          type: 'section',
          title: 'Rates',
          layout: 'matrix',
          fields: [
            { key: 'speed', type: 'radio', label: 'Speed', options },
            { key: 'price', type: 'radio', label: 'Price', options },
          ],
        },
        { key: 'kids', type: 'group', label: 'Kids', defaultItems: 1, fields: [{ key: 'kid', type: 'text', label: 'Kid name' }] },
      ],
    },
    {
      id: 'more',
      title: 'More',
      fields: [
        ...['phone', 'number', 'password', 'checkbox', 'switch', 'file', 'date', 'datetime', 'time', 'textarea', 'scale', 'rating'].map(
          (type) => ({ key: type, type, label: type }),
        ),
        ...['select', 'autocomplete', 'multiselect'].map((type) => ({ key: type, type, label: type, options })),
        { key: 'source', type: 'hidden', label: 'Source' },
      ],
    },
  ],
};

const single: FormDefinition = {
  id: 'single',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'city', type: 'text', label: 'City' },
    { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
  ],
};

const stray = () =>
  [...document.querySelectorAll('[class]')].filter(
    (element) => element.tagName !== 'FORM' && [...element.classList].some((name) => name.startsWith('fh-')),
  );

export function layoutScenarios(harness: RendererHarness, { it, expect, fn, waitFor, screen }: TestKit): void {
  const design = harness.design!;
  const active = () => document.activeElement;
  const input = (name: string) => screen.getByRole('textbox', { name });
  const dialog = () => document.querySelector('.ds-dialog')!;

  it('renders a design system without Formhaus markup outside the form', async () => {
    harness.mount({ definition: survey, ...design, onSubmit: () => ({ ok: false, formErrors: ['Server said no'] }) });
    expect(stray()).toEqual([]);
    expect([...document.querySelectorAll('.ds-progress li')].map((item) => item.textContent)).toEqual(['About', 'More']);
    expect(['Speed', 'Price'].map((name) => input(name).getAttribute('data-matrix'))).toEqual(['0/2', '1/2']);
    expect([dialog().getAttribute('data-open'), dialog().textContent]).toEqual(['false', 'RemoveRemoveCancel']);

    await harness.type(input('Kid name'), 'Bo');
    await harness.click(screen.getByRole('button', { name: /^Remove/ }));
    await waitFor(() => expect(dialog().getAttribute('data-open')).toBe('true'));
    expect(dialog().querySelector('p')?.textContent).toMatch(/\?$/);
    await harness.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(dialog().getAttribute('data-open')).toBe('false'));

    await harness.click(screen.getByRole('button', { name: 'Continue' }));
    const summary = document.querySelector<HTMLElement>('[data-fh="error-summary"]')!;
    await waitFor(() => expect(active()).toBe(summary));
    expect([summary.getAttribute('role'), summary.getAttribute('tabindex'), summary.getAttribute('data-count')]).toEqual([
      'alert',
      '-1',
      '2',
    ]);
    expect(stray()).toEqual([]);
    await harness.click(screen.getByRole('link', { name: /^Email/ }));
    await waitFor(() => expect(active()).toBe(input('Email')));

    await harness.type(input('Name'), 'Ada');
    await harness.type(input('Email'), 'ada@example.com');
    await harness.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('textbox', { name: 'phone' });
    expect(document.querySelector('[data-fh="progress"]')?.textContent).toContain('2/2');
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    expect((await screen.findByText('Server said no')).closest('[data-fh="form-errors"]')?.getAttribute('role')).toBe('alert');
    expect(stray()).toEqual([]);
  });

  it('focuses the first invalid custom control after a failed submit with one error', async () => {
    harness.mount({ definition: single, ...design, testIds: true, onSubmit: () => {} });
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(active()).toBe(input('Name')));
    const summary = document.querySelector('[data-fh="error-summary"]');
    expect([summary?.getAttribute('data-count'), summary?.getAttribute('data-testid')]).toEqual(['1', 'single.summary']);
  });

  it('focuses the control inside a data-fh="field" root when only the error has the id', async () => {
    const definition: FormDefinition = {
      ...single,
      fields: [single.fields![1], { key: 'wrapped', type: 'x-wrapped', label: 'Wrapped', validation: { required: true } }],
    };
    harness.mount({ definition, components: harness.controls, onSubmit: () => {} });
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(active()?.getAttribute('data-fh')).toBe('error-summary'));
    await harness.click(await screen.findByRole('link', { name: /^Wrapped/ }));
    await waitFor(() => expect(active()).toBe(screen.getByRole('textbox', { name: 'Wrapped' })));
  });

  it('prefers layout over the old keys, keeps the old props for old components and warns once per old key', async () => {
    const onWarning = fn<(issue: DefinitionIssue) => void>();
    const { section } = harness.containers!;
    const mounted = harness.mount({
      definition: survey,
      components: { ...design.components, section },
      layout: { ...design.layout, actions: undefined, progress: undefined },
      actionsComponent: design.layout.actions,
      progressComponent: design.layout.progress,
      onWarning,
      onSubmit: () => {},
    });
    expect(screen.queryByRole('heading', { name: 'Rates' })).toBeNull();
    expect(document.querySelector('.ds-section legend')?.textContent).toBe('Rates');
    expect(document.querySelector('.ds-actions')?.hasAttribute('data-fh')).toBe(false);
    expect(document.querySelector('.ds-progress')?.hasAttribute('data-fh')).toBe(false);
    expect(document.querySelectorAll('.ds-progress li')).toHaveLength(0);
    await mounted.update({ definition: { ...survey } });
    const legacy = () => onWarning.mock.calls.filter(([issue]) => issue.code === 'legacy-layout');
    await waitFor(() => expect(legacy()).toHaveLength(3));
    expect(legacy().map(([issue]) => [issue.code, issue.hint])).toEqual([
      ['legacy-layout', 'Pass it as layout.section.'],
      ['legacy-layout', 'Pass it as layout.actions.'],
      ['legacy-layout', 'Pass it as layout.progress.'],
    ]);
  });

  it('keeps the default markup and mounts the old confirm dialog only while a removal waits', async () => {
    const { confirmDialog } = harness.containers!;
    harness.mount({ definition: survey, components: { ...design.components, confirmDialog }, onSubmit: () => {} });
    expect(document.querySelector('.fh-step-progress')?.getAttribute('data-fh')).toBe('progress');
    expect(document.querySelector('.fh-step-progress__steps')).toBeNull();
    expect(document.querySelector('.fh-form__fields')?.getAttribute('data-fh')).toBe('fields');
    expect(document.querySelector('.fh-form-actions')?.getAttribute('data-fh')).toBe('actions');
    expect(screen.queryByText('Yes')).toBeNull();
    await harness.type(input('Kid name'), 'Bo');
    await harness.click(screen.getByRole('button', { name: /^Remove/ }));
    expect(await screen.findByText('Yes')).toBeTruthy();
  });
}
