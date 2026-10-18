import type { FormDefinition } from '../../src';
import { event } from './containers.scenarios';
import type { RendererHarness, TestKit } from './fixtures';

const booking: FormDefinition = {
  id: 'booking',
  title: '',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'source',
      type: 'hidden',
      label: 'Source',
      defaultValue: 'direct',
      validation: { pattern: '^[a-z]+$', patternMessage: 'Open the form from the invite link' },
    },
    { key: 'campaign', type: 'hidden', label: 'Campaign' },
    { key: 'startsAt', type: 'time', label: 'Start time' },
  ],
};

const wizard: FormDefinition = {
  id: 'hidden-steps',
  title: '',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'one',
      title: 'One',
      fields: [
        { key: 'source', type: 'hidden', label: 'Source' },
        { key: 'name', type: 'text', label: 'Name' },
      ],
    },
    { id: 'two', title: 'Two', fields: [{ key: 'city', type: 'text', label: 'City' }] },
  ],
};

export function fieldScenarios(harness: RendererHarness, { it, expect, waitFor, screen, fn }: TestKit): void {
  const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
  const topErrors = () => document.querySelector('.fh-form__top-errors')?.textContent?.trim();

  it('renders a time field as a native time input and submits its value', async () => {
    const onSubmit = fn();
    harness.mount({ definition: booking, onSubmit });
    const input = document.querySelector('input[type="time"]') as HTMLInputElement;
    expect(input.labels?.[0]?.textContent).toContain('Start time');
    await harness.type(input, '14:30');
    await harness.click(button('Send'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ source: 'direct', startsAt: '14:30' }, []));
  });

  it('shows the time message for an impossible time', async () => {
    const onSubmit = fn();
    harness.mount({ definition: booking, initialValues: { startsAt: '24:00' }, onSubmit });
    await harness.click(button('Send'));
    await screen.findByText('Enter a valid time');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits hidden values without a label or a focusable control', async () => {
    const onSubmit = fn();
    harness.mount({ definition: booking, initialValues: { campaign: 'spring' }, onSubmit });
    expect(document.querySelectorAll('input[type="hidden"]')).toHaveLength(2);
    expect(document.querySelectorAll('.fh-field')).toHaveLength(1);
    expect(document.body.textContent).not.toContain('Source');
    await harness.click(button('Send'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ source: 'direct', campaign: 'spring' }, []));
  });

  it('shows a hidden field error at form level and not in the error summary', async () => {
    const onSubmit = fn();
    harness.mount({ definition: booking, initialValues: { source: 'News Letter' }, errorSummary: true, onSubmit });
    await harness.click(button('Send'));
    await waitFor(() => expect(topErrors()).toBe('Open the form from the invite link'));
    expect(document.querySelector('.fh-error-summary')).toBeNull();
    expect(document.activeElement?.getAttribute('type')).not.toBe('hidden');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('names a required hidden field in its form-level error', async () => {
    const required: FormDefinition = {
      ...booking,
      fields: [{ key: 'ref', type: 'hidden', label: 'Referral code', validation: { required: true } }],
    };
    harness.mount({ definition: required, onSubmit: fn() });
    await harness.click(button('Send'));
    await waitFor(() => expect(topErrors()).toBe('Referral code: This field is required'));
  });

  it('keeps the step and the step marks when the server rejects a hidden value', async () => {
    harness.mount({
      definition: wizard,
      initialValues: { name: 'Ada' },
      stepErrorMarks: true,
      onSubmit: () => ({ ok: false, errors: { source: 'Expired link' } }),
    });
    await harness.click(button('Continue'));
    await screen.findByRole('heading', { name: 'Two' });
    await harness.click(button('Send'));
    await screen.findByText('Expired link');
    expect(screen.getByRole('heading', { name: 'Two' })).toBeDefined();
    expect(document.querySelector('.fh-step-progress__step--invalid')).toBeNull();
  });

  it('reports focus and blur of group item fields by path', async () => {
    const onFormEvent = fn();
    harness.mount({ definition: event, initialValues: { people: [{ name: 'Ada' }] }, onSubmit: () => {}, onFormEvent });
    const name = screen.getByRole('textbox', { name: /^Name/ });
    name.focus();
    name.blur();
    await waitFor(() => expect(onFormEvent).toHaveBeenCalledWith({ type: 'field_blurred', fieldKey: 'people.0.name', hasValue: true }));
    expect(onFormEvent).toHaveBeenCalledWith({ type: 'field_focused', fieldKey: 'people.0.name' });
  });
}
