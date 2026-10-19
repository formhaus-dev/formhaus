import type { FormDefinition, FormStep } from '../../src';
import type { RendererHarness, TestKit } from './fixtures';

const countryStep: FormStep = {
  id: 'country',
  title: 'Country',
  fields: [
    {
      key: 'country',
      type: 'radio',
      label: 'Country',
      options: [
        { value: 'us', label: 'United States' },
        { value: 'de', label: 'Germany' },
      ],
    },
    { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
  ],
};

const reviewStep: FormStep = { id: 'review', title: 'Review', fields: [] };

const kyc: FormDefinition = { id: 'kyc', title: '', submit: { label: 'Send' }, steps: [countryStep, reviewStep] };

const usKyc: FormDefinition = {
  ...kyc,
  steps: [
    countryStep,
    { id: 'tax', title: 'Tax', fields: [{ key: 'ssn', type: 'text', label: 'SSN', validation: { required: true } }] },
    {
      id: 'address',
      title: 'Address',
      fields: [
        { key: 'street', type: 'text', label: 'Street', defaultValue: 'Main St' },
        { key: 'campaign', type: 'hidden', label: 'Campaign', source: { query: 'campaign' } },
      ],
    },
    reviewStep,
  ],
};

export function definitionScenarios(harness: RendererHarness, { it, expect, screen, fn }: TestKit): void {
  const button = (name: string) => screen.getByRole('button', { name });
  const textbox = (name: string) => screen.getByRole('textbox', { name: new RegExp(name) }) as HTMLInputElement;

  it('keeps answers and the step when a new definition arrives with keepValues', async () => {
    const previous = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', '/?campaign=spring');
    try {
      const onSubmit = fn();
      const mounted = harness.mount({ definition: kyc, keepValues: true, onSubmit });
      await harness.click(screen.getByRole('radio', { name: 'United States' }));
      await harness.type(textbox('Name'), 'Ada');
      await mounted.update({ definition: usKyc });
      expect(textbox('Name').value).toBe('Ada');
      expect((screen.getByRole('radio', { name: 'United States' }) as HTMLInputElement).checked).toBe(true);
      await harness.click(button('Continue'));
      await harness.type(await screen.findByRole('textbox', { name: /SSN/ }), '123');
      await harness.click(button('Continue'));
      expect(((await screen.findByRole('textbox', { name: /Street/ })) as HTMLInputElement).value).toBe('Main St');
      await harness.click(button('Continue'));
      await screen.findByRole('heading', { name: 'Review' });
      await harness.click(button('Send'));
      expect(onSubmit).toHaveBeenCalledWith({ country: 'us', name: 'Ada', ssn: '123', street: 'Main St', campaign: 'spring' }, []);
    } finally {
      window.history.replaceState(null, '', previous);
    }
  });

  it('stays on the current step when steps are inserted before it', async () => {
    const mounted = harness.mount({ definition: kyc, keepValues: true, initialValues: { country: 'us', name: 'Ada' }, onSubmit: () => {} });
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Review' });
    await mounted.update({ definition: usKyc });
    expect(screen.getByRole('heading', { name: 'Review' })).toBeDefined();
    expect(document.querySelector('.fh-step-progress__counter')?.textContent?.trim()).toBe('Step 4 of 4');
    await harness.click(button('Send'));
    expect(await screen.findByRole('textbox', { name: /SSN/ })).toBeDefined();
  });

  it('resets the form on a new definition without keepValues', async () => {
    const mounted = harness.mount({ definition: kyc, onSubmit: () => {} });
    await harness.type(textbox('Name'), 'Ada');
    await mounted.update({ definition: usKyc });
    expect(textbox('Name').value).toBe('');
  });
}
