import type { FormDefinition, LocaleCatalog } from '../../src';
import ru from '../../locales/ru.json';
import { filled, wizard, type RendererHarness, type TestKit } from './fixtures';

export function labelScenarios(harness: RendererHarness, { it, expect, screen }: TestKit): void {
  const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
  const marks = () => [...document.querySelectorAll('.fh-step-progress__step')];

  it('uses the labels prop for buttons, the counter and the summary', async () => {
    const labels = { continue: 'Weiter', back: 'Zurück', stepOf: 'Schritt {current} von {total}', errorSummary: 'Bitte prüfen' };
    harness.mount({ definition: wizard, labels, errorSummary: true, onSubmit: () => {} });
    expect(document.querySelector('.fh-step-progress__counter')?.textContent?.trim()).toBe('Schritt 1 von 3');
    await harness.click(button('Weiter'));
    await screen.findByText('Bitte prüfen');
    await harness.type(screen.getByRole('textbox', { name: /Name/ }), 'Ada');
    await harness.click(button('Weiter'));
    await screen.findByRole('heading', { name: 'Two' });
    expect(button('Zurück')).toBeDefined();
    expect(document.querySelector('.fh-step-progress__counter')?.textContent?.trim()).toBe('Schritt 2 von 3');
  });

  it('takes the skip, submit, step title and error mark texts from the labels', async () => {
    const [one, two, three] = wizard.steps!;
    const definition = {
      ...wizard,
      submit: {},
      labels: { stepTitle: 'Schritt {index}' },
      steps: [one, { ...two, title: '', skip: {} }, three],
    } as unknown as FormDefinition;
    harness.mount({
      definition,
      initialValues: filled,
      stepErrorMarks: true,
      labels: { skip: 'Überspringen', submit: 'Senden', stepErrors: 'Fehler: {count}' },
      onSubmit: () => ({ ok: false, errors: { name: 'Taken' } }),
    });
    expect(marks().map((item) => item.textContent?.trim())).toEqual(['One', 'Schritt 2', 'Three']);
    await harness.click(button('Continue'));
    await harness.click(await screen.findByRole('button', { name: 'Überspringen' }));
    await harness.click(await screen.findByRole('button', { name: 'Senden' }));
    await screen.findByText('Taken');
    expect(marks().map((item) => item.textContent?.trim())).toEqual(['One · Fehler: 1', 'Schritt 2', 'Three']);
  });

  it('falls back to the default skip, submit and step texts', async () => {
    const [one, two, three] = wizard.steps!;
    const definition = { ...wizard, submit: {}, steps: [one, { ...two, title: '', skip: {} }, three] } as unknown as FormDefinition;
    harness.mount({
      definition,
      initialValues: filled,
      stepErrorMarks: true,
      onSubmit: () => ({ ok: false, errors: { name: 'Taken', city: 'Far' } }),
    });
    expect(marks()[1].textContent?.trim()).toBe('Step 2');
    await harness.click(button('Continue'));
    await harness.click(await screen.findByRole('button', { name: 'Skip' }));
    await harness.click(await screen.findByRole('button', { name: 'Submit' }));
    await screen.findByText('Taken');
    expect(marks().map((item) => item.textContent?.trim())).toEqual(['One · Errors: 1', 'Step 2', 'Three · Errors: 1']);
  });

  it('keeps explicit skip and submit labels over the catalog', async () => {
    harness.mount({ definition: wizard, initialValues: filled, labels: { skip: 'Überspringen', submit: 'Senden' }, onSubmit: () => {} });
    await harness.click(button('Continue'));
    await harness.click(await screen.findByRole('button', { name: 'Skip' }));
    expect(await screen.findByRole('button', { name: 'Send' })).toBeDefined();
  });

  it('prefers the labels option over definition.labels and follows its changes', async () => {
    const [one, two] = wizard.steps!;
    const definition = {
      ...wizard,
      submit: {},
      labels: { stepTitle: 'Teil {index}', skip: 'Weiter so' },
      steps: [{ ...one, title: '', skip: {} }, two],
    } as unknown as FormDefinition;
    const mounted = harness.mount({
      definition,
      stepErrorMarks: true,
      labels: { stepTitle: 'Schritt {index}', skip: 'Überspringen' },
      onSubmit: () => {},
    });
    expect(marks()[0].textContent?.trim()).toBe('Schritt 1');
    expect(button('Überspringen')).toBeDefined();
    await mounted.update({ labels: { stepTitle: 'Etappe {index}', skip: 'Passer' } });
    expect(marks()[0].textContent?.trim()).toBe('Etappe 1');
    expect(button('Passer')).toBeDefined();
    await mounted.update({ labels: undefined });
    expect(marks()[0].textContent?.trim()).toBe('Teil 1');
    expect(button('Weiter so')).toBeDefined();
  });

  it('localizes validation messages with plural forms and labels from a locale catalog', async () => {
    const [one, ...rest] = wizard.steps!;
    const definition = {
      ...wizard,
      steps: [{ ...one, fields: [{ ...one.fields[0], validation: { required: true, minLength: 3 } }] }, ...rest],
    } as FormDefinition;
    const mounted = harness.mount({ definition, locale: ru as LocaleCatalog, onSubmit: () => {} });
    expect(document.querySelector('.fh-step-progress__counter')?.textContent?.trim()).toBe('Шаг 1 из 3');
    await harness.type(screen.getByRole('textbox', { name: /Name/ }), 'Ad');
    await harness.click(button('Далее'));
    await screen.findByText('Не менее 3 символов');
    await mounted.update({ locale: [{ locale: 'de', messages: {}, labels: { continue: 'Weiter' } }, ru as LocaleCatalog] });
    expect(button('Weiter')).toBeDefined();
  });

  it('switches group labels and the next validation messages when the locale changes', async () => {
    const definition: FormDefinition = {
      id: 'crew',
      title: '',
      submit: { label: 'Send' },
      fields: [
        { key: 'name', type: 'text', label: 'Name', validation: { minLength: 3 } },
        { key: 'kids', type: 'group', label: 'Kids', defaultItems: 1, fields: [{ key: 'kid', type: 'text', label: 'Kid name' }] },
      ],
    };
    const mounted = harness.mount({ definition, onSubmit: () => {} });
    await harness.type(screen.getByRole('textbox', { name: /^Name/ }), 'Ad');
    await harness.click(button('Send'));
    await screen.findByText('Minimum length is 3');
    expect(button('Add')).toBeDefined();
    await mounted.update({ locale: ru as LocaleCatalog });
    expect(button('Добавить')).toBeDefined();
    expect(button('Удалить «Kids 1»')).toBeDefined();
    await harness.click(button('Send'));
    await screen.findByText('Не менее 3 символов');
  });
}
