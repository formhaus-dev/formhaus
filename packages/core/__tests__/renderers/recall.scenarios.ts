import type { FormDefinition } from '../../src';
import type { RendererHarness, TestKit } from './fixtures';

const definition = (formatVersion: string): FormDefinition => ({
  formatVersion,
  id: 'recall',
  title: '',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'about',
      title: 'About you',
      fields: [
        { key: 'name', type: 'text', label: 'Name' },
        { key: 'email', type: 'email', label: 'Email', helperText: 'We write to {{name}} here' },
        {
          key: 'plan',
          type: 'radio',
          label: 'Plan',
          options: [
            { value: 'pro', label: 'Pro' },
            { value: 'team', label: 'Team' },
          ],
        },
        {
          key: 'guests',
          type: 'group',
          label: 'Guests of {{name}}',
          fields: [
            { key: 'guest', type: 'text', label: 'Guest' },
            { key: 'meal', type: 'text', label: 'Meal for {{guest}}' },
          ],
        },
      ],
    },
    {
      id: 'review',
      title: 'Thanks, {{name}}',
      description: 'Check your answers: {{name}}, {{email}}, plan {{plan}}',
      fields: [
        {
          key: 'extras',
          type: 'section',
          title: '{{guests}} guests',
          fields: [{ key: 'note', type: 'text', label: 'Note' }],
        },
      ],
    },
  ],
});

export function recallScenarios(harness: RendererHarness, { it, expect, waitFor, screen }: TestKit): void {
  const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
  const text = (selector: string) => document.querySelector(selector)?.textContent?.trim();

  it('shows earlier answers in texts', async () => {
    harness.mount({ definition: definition('1.5'), onSubmit: () => {} });
    await harness.type(screen.getByRole('textbox', { name: /^Name/ }), 'Ada');
    await waitFor(() => expect(document.body.textContent).toContain('We write to Ada here'));
    expect(text('.fh-group legend')).toBe('Guests of Ada');
    await harness.type(screen.getByRole('textbox', { name: /^Email/ }), 'ada@example.com');
    await harness.click(screen.getByRole('radio', { name: 'Team' }));
    await harness.click(button('Add'));
    await harness.type(await screen.findByRole('textbox', { name: /^Guest/ }), 'Bo');
    await screen.findByRole('textbox', { name: /Meal for Bo/ });
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Thanks, Ada' });
    expect(document.body.textContent).toContain('Check your answers: Ada, ada@example.com, plan Team');
    expect(text('.fh-section__title')).toBe('1 guests');
  });

  it('greets by name on the next step', async () => {
    harness.mount({
      definition: {
        formatVersion: '1.5',
        id: 'hello',
        title: '',
        submit: { label: 'Send' },
        steps: [
          { id: 'name', title: 'Your name', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
          {
            id: 'more',
            title: 'Hello, {{name}}!',
            description: 'A few more questions.',
            fields: [{ key: 'role', type: 'text', label: 'Role' }],
          },
        ],
      },
      onSubmit: () => {},
    });
    await harness.type(screen.getByRole('textbox', { name: /^Name/ }), 'Ada');
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Hello, Ada!' });
    expect(document.body.textContent).toContain('A few more questions.');
  });

  const booking = (lang: string): FormDefinition => ({
    formatVersion: '1.5',
    id: 'booking',
    title: '',
    lang,
    submit: { label: 'Send' },
    steps: [
      {
        id: 'trip',
        title: 'Trip',
        fields: [
          { key: 'name', type: 'text', label: 'Name' },
          { key: 'day', type: 'date', label: 'Day' },
          { key: 'budget', type: 'number', label: 'Budget' },
        ],
      },
      {
        id: 'review',
        title: 'Hello, {{name}}',
        description: 'Arriving {{day}}',
        fields: [{ key: 'note', type: 'text', label: 'Budget {{budget}}', validation: { required: true } }],
      },
    ],
  });
  const values = { name: 'Ada', day: '2027-06-14', budget: 4200 };
  const review = async () => {
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Hello, Ada' });
  };

  it.each([
    ['en-US', undefined, 'Jun'],
    ['ru', undefined, 'июн'],
    ['en-US', 'ru', 'июн'],
  ])('formats a date and a number for the definition lang %s and the lang prop %s', async (definitionLang, lang, month) => {
    harness.mount({ definition: booking(definitionLang), lang, initialValues: values, onSubmit: () => {} });
    await review();
    const text = document.body.textContent!;
    expect(text).not.toContain('2027-06-14');
    expect(text).toMatch(new RegExp(`Arriving [^A-Za-z]*14\\D+${month}|Arriving ${month}\\D+14`));
    const label = [...document.querySelectorAll('label')].map((item) => item.textContent ?? '').find((item) => item.startsWith('Budget'))!;
    expect(label).not.toContain('4200');
    expect(label.replace(/\D/g, '')).toBe('4200');
  });

  it('formats recalled answers with formatRecall in texts and the error summary', async () => {
    harness.mount({
      definition: booking('en-US'),
      initialValues: values,
      errorSummary: true,
      formatRecall: (value, field) => (field.type === 'number' ? `$${String(value)}` : String(value)),
      onSubmit: () => {},
    });
    await review();
    expect(document.body.textContent).toContain('Arriving 2027-06-14');
    await harness.click(button('Send'));
    await screen.findByRole('link', { name: /^Budget \$4200: / });
  });

  it('repaints recalled texts when formatRecall or lang changes', async () => {
    const mounted = harness.mount({
      definition: booking('en-US'),
      initialValues: values,
      errorSummary: true,
      formatRecall: (value) => `[${String(value)}]`,
      onSubmit: () => {},
    });
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Hello, [Ada]' });
    await harness.click(button('Send'));
    await screen.findByRole('link', { name: /^Budget \[4200\]: / });
    await mounted.update({ formatRecall: (value) => `<${String(value)}>` });
    await screen.findByRole('link', { name: /^Budget <4200>: / });
    await screen.findByRole('textbox', { name: /^Budget <4200>/ });
    expect(document.body.textContent).toContain('Arriving <2027-06-14>');
    await mounted.update({ formatRecall: (value, _, locale) => `${String(value)} ${locale}` });
    await mounted.update({ lang: 'ru' });
    await screen.findByRole('textbox', { name: /^Budget 4200 ru/ });
    expect(document.body.textContent).toContain('Arriving 2027-06-14 ru');
  });

  it('names the removed item in the announcement', async () => {
    harness.mount({
      definition: {
        formatVersion: '1.5',
        id: 'kids',
        title: '',
        submit: { label: 'Send' },
        fields: [
          { key: 'kids', type: 'group', label: 'Kids', itemLabel: 'Kid {{kid}}', fields: [{ key: 'kid', type: 'text', label: 'Name' }] },
        ],
      },
      initialValues: { kids: [{ kid: 'Ada' }, { kid: 'Bo' }] },
      confirmRemove: false,
      onSubmit: () => {},
    });
    const status = () => document.querySelector('.fh-group__status')?.textContent?.trim();
    await harness.click(button('Remove Kid Ada'));
    await waitFor(() => expect(status()).toBe('Kid Ada removed'));
    await harness.click(button('Add'));
    await harness.click(button('Remove Kid Bo'));
    await waitFor(() => expect(status()).toBe('Kid Bo removed'));
  });

  it('titles group items with their own answers', async () => {
    harness.mount({
      definition: {
        formatVersion: '1.5',
        id: 'kids',
        title: '',
        submit: { label: 'Send' },
        fields: [
          {
            key: 'kids',
            type: 'group',
            label: 'Kids',
            itemLabel: 'Kid {index}: {{kid}}',
            fields: [{ key: 'kid', type: 'text', label: 'Name' }],
          },
        ],
      },
      initialValues: { kids: [{ kid: 'Bo' }, { kid: '' }] },
      onSubmit: () => {},
    });
    await screen.findByRole('button', { name: /Kid 1: Bo/ });
    await harness.type(screen.getAllByRole('textbox', { name: /^Name/ })[1], 'Cy');
    await screen.findByRole('button', { name: /Kid 2: Cy/ });
  });

  it('shows the braces below format 1.5', async () => {
    harness.mount({ definition: definition('1.4'), initialValues: { name: 'Ada' }, onSubmit: () => {} });
    await waitFor(() => expect(document.body.textContent).toContain('We write to {{name}} here'));
  });
}
