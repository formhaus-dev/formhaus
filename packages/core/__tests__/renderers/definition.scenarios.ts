import type { FormDefinition, FormStep } from '../../src';
import type { RendererHarness, TestKit } from './fixtures';

const planStep: FormStep = {
  id: 'plan',
  title: 'Plan',
  fields: [
    {
      key: 'plan',
      type: 'radio',
      label: 'Plan',
      options: [
        { value: 'team', label: 'Team' },
        { value: 'solo', label: 'Solo' },
      ],
    },
    { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
  ],
};

const reviewStep: FormStep = { id: 'review', title: 'Review', fields: [] };

const signup: FormDefinition = { id: 'signup', title: '', submit: { label: 'Send' }, steps: [planStep, reviewStep] };

const teamSignup: FormDefinition = {
  ...signup,
  steps: [
    planStep,
    { id: 'team', title: 'Team', fields: [{ key: 'company', type: 'text', label: 'Company', validation: { required: true } }] },
    {
      id: 'billing',
      title: 'Billing',
      fields: [
        { key: 'cycle', type: 'text', label: 'Billing cycle', defaultValue: 'monthly' },
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
      const mounted = harness.mount({ definition: signup, keepValues: true, onSubmit });
      await harness.click(screen.getByRole('radio', { name: 'Team' }));
      const name = textbox('Name');
      await harness.type(name, 'Ada');
      await mounted.update({ definition: teamSignup });
      expect(textbox('Name')).toBe(name);
      expect(name.value).toBe('Ada');
      expect((screen.getByRole('radio', { name: 'Team' }) as HTMLInputElement).checked).toBe(true);
      await harness.click(button('Continue'));
      await harness.type(await screen.findByRole('textbox', { name: /Company/ }), 'Acme');
      await harness.click(button('Continue'));
      expect(((await screen.findByRole('textbox', { name: /Billing cycle/ })) as HTMLInputElement).value).toBe('monthly');
      await harness.click(button('Continue'));
      await screen.findByRole('heading', { name: 'Review' });
      await harness.click(button('Send'));
      expect(onSubmit).toHaveBeenCalledWith({ plan: 'team', name: 'Ada', company: 'Acme', cycle: 'monthly', campaign: 'spring' }, []);
    } finally {
      window.history.replaceState(null, '', previous);
    }
  });

  it('stays on the current step when steps are inserted before it', async () => {
    const mounted = harness.mount({
      definition: signup,
      keepValues: true,
      initialValues: { plan: 'team', name: 'Ada' },
      onSubmit: () => {},
    });
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Review' });
    await mounted.update({ definition: teamSignup });
    expect(screen.getByRole('heading', { name: 'Review' })).toBeDefined();
    expect(document.querySelector('.fh-step-progress__counter')?.textContent?.trim()).toBe('Step 4 of 4');
    await harness.click(button('Send'));
    expect(await screen.findByRole('textbox', { name: /Company/ })).toBeDefined();
  });

  it('resets the form on a new definition without keepValues', async () => {
    const mounted = harness.mount({ definition: signup, onSubmit: () => {} });
    await harness.type(textbox('Name'), 'Ada');
    await mounted.update({ definition: teamSignup });
    expect(textbox('Name').value).toBe('');
  });
}
