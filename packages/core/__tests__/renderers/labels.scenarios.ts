import type { FormDefinition } from '../../src';
import { filled, wizard, type RendererHarness, type TestKit } from './fixtures';

export function labelScenarios(harness: RendererHarness, { it, expect, screen }: TestKit): void {
  const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
  const marks = () => [...document.querySelectorAll('.fh-step-progress__step')];
  const markText = (item: Element) =>
    [...item.querySelectorAll('.fh-step-progress__name, .fh-step-progress__errors-label')].map((part) => part.textContent).join(' · ');

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
    expect(marks().map(markText)).toEqual(['One', 'Schritt 2', 'Three']);
    await harness.click(button('Continue'));
    await harness.click(await screen.findByRole('button', { name: 'Überspringen' }));
    await harness.click(await screen.findByRole('button', { name: 'Senden' }));
    await screen.findByText('Taken');
    expect(marks().map(markText)).toEqual(['One · Fehler: 1', 'Schritt 2', 'Three']);
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
    expect(markText(marks()[1])).toBe('Step 2');
    await harness.click(button('Continue'));
    await harness.click(await screen.findByRole('button', { name: 'Skip' }));
    await harness.click(await screen.findByRole('button', { name: 'Submit' }));
    await screen.findByText('Taken');
    expect(marks().map(markText)).toEqual(['One · Errors: 1', 'Step 2', 'Three · Errors: 1']);
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
    expect(markText(marks()[0])).toBe('Schritt 1');
    expect(button('Überspringen')).toBeDefined();
    await mounted.update({ labels: { stepTitle: 'Etappe {index}', skip: 'Passer' } });
    expect(markText(marks()[0])).toBe('Etappe 1');
    expect(button('Passer')).toBeDefined();
    await mounted.update({ labels: undefined });
    expect(markText(marks()[0])).toBe('Teil 1');
    expect(button('Weiter so')).toBeDefined();
  });
}
