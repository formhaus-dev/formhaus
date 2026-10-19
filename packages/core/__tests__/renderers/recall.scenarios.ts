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

  it('shows the braces below format 1.5', async () => {
    harness.mount({ definition: definition('1.4'), initialValues: { name: 'Ada' }, onSubmit: () => {} });
    await waitFor(() => expect(document.body.textContent).toContain('We write to {{name}} here'));
  });
}
