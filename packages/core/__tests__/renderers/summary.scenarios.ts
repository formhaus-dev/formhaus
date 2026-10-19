import { filled, wizard, type RendererHarness, type TestKit } from './fixtures';

export function summaryScenarios(harness: RendererHarness, { it, expect, waitFor, screen }: TestKit): void {
  const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;

  it('shows the current step name with its error count and the summary between the fields and the buttons', async () => {
    harness.mount({ definition: wizard, errorSummary: true, onSubmit: () => {} });
    await harness.click(button('Continue'));
    await screen.findByRole('link', { name: 'Name: This field is required' });
    const heading = screen.getByRole('heading', { name: 'One' });
    expect(heading.nextElementSibling?.className).toBe('fh-step-progress__status');
    expect(heading.nextElementSibling?.textContent?.trim()).toBe('Errors: 1');
    expect(document.querySelector('.fh-step-progress__steps')).toBeNull();
    expect(document.querySelector('.fh-error-summary__step')).toBeNull();
    const summary = document.querySelector('.fh-error-summary')!;
    expect(document.querySelector('.fh-form__fields')!.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(summary.compareDocumentPosition(document.querySelector('.fh-form-actions')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await harness.type(screen.getByRole('textbox', { name: /Name/ }), 'Ada');
    await waitFor(() => expect(document.querySelector('.fh-step-progress__status')).toBeNull());
  });

  it('groups summary errors from other steps under the step name', async () => {
    harness.mount({
      definition: wizard,
      initialValues: filled,
      errorSummary: true,
      onSubmit: () => ({ ok: false, errors: { name: 'Taken', city: 'Unknown' } }),
    });
    await harness.click(button('Continue'));
    await harness.click(await screen.findByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { name: 'Three' });
    await harness.click(button('Send'));
    const link = await screen.findByRole('link', { name: 'City: Unknown' });
    expect([...document.querySelectorAll('.fh-error-summary__step')].map((title) => title.textContent?.trim())).toEqual(['One', 'Three']);
    expect(screen.getAllByRole('link').map((item) => item.textContent?.trim())).toEqual(['Name: Taken', 'City: Unknown']);
    await harness.click(link);
    await screen.findByRole('heading', { name: 'Three' });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /City/ })));
  });

  it('joins a label that ends with punctuation and its message with a space', async () => {
    harness.mount({
      definition: {
        id: 'questions',
        title: '',
        submit: { label: 'Send' },
        fields: [
          { key: 'need', type: 'text', label: 'What do you need?' },
          { key: 'name', type: 'text', label: 'お名前：' },
          { key: 'plain', type: 'text', label: 'Plain' },
        ],
      },
      errorSummary: true,
      onSubmit: () => ({ ok: false, errors: { need: 'Choose the kind of project', name: '必須です', plain: 'Bad' } }),
    });
    await harness.click(button('Send'));
    await screen.findByRole('link', { name: 'Plain: Bad' });
    expect(screen.getAllByRole('link').map((item) => item.textContent?.trim())).toEqual([
      'What do you need? Choose the kind of project',
      'お名前： 必須です',
      'Plain: Bad',
    ]);
  });
}
