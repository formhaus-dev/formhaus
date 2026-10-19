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

const autofill: FormDefinition = {
  formatVersion: '1.5',
  id: 'autofill',
  title: '',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'about',
      title: 'About you',
      description: 'We keep it short.\nTwo minutes at most.',
      fields: [
        { key: 'first', type: 'text', label: 'First name', autocomplete: 'given-name' },
        { key: 'mail', type: 'email', label: 'Email', autocomplete: 'email', helperText: 'Work address\nor personal' },
        { key: 'bio', type: 'textarea', label: 'Bio', autocomplete: 'off' },
        { key: 'born', type: 'date', label: 'Born', autocomplete: 'bday' },
        { key: 'city', type: 'text', label: 'City' },
        {
          key: 'state',
          type: 'autocomplete',
          label: 'State',
          autocomplete: 'address-level1',
          options: [{ value: 'ca', label: 'California' }],
        },
        { key: 'town', type: 'autocomplete', label: 'Town', options: [{ value: 'sf', label: 'San Francisco' }] },
        {
          key: 'plan',
          type: 'radio',
          label: 'Plan',
          autocomplete: 'off',
          options: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ],
        },
        {
          key: 'guests',
          type: 'group',
          label: 'Guests',
          defaultItems: 2,
          fields: [
            { key: 'guest', type: 'text', label: 'Guest', autocomplete: 'name' },
            { key: 'diet', type: 'text', label: 'Diet', autocomplete: 'off' },
            { key: 'street', type: 'text', label: 'Street', autocomplete: 'section-home street-address' },
            { key: 'code', type: 'text', label: 'Code', autocomplete: 'one-time-code' },
          ],
        },
        {
          key: 'extras',
          type: 'section',
          title: 'Extras',
          description: 'First line\nSecond line',
          fields: [{ key: 'note', type: 'text', label: 'Note' }],
        },
      ],
    },
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

  it('reports a field shown and hidden by its condition', async () => {
    const onFormEvent = fn();
    harness.mount({ definition: event, onSubmit: () => {}, onFormEvent });
    await harness.click(screen.getByRole('checkbox', { name: 'Company' }));
    await screen.findByRole('textbox', { name: 'Street' });
    await harness.click(screen.getByRole('checkbox', { name: 'Company' }));
    await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Street' })).toBeNull());
    expect(
      onFormEvent.mock.calls
        .map(([item]) => item)
        .filter((item) => ['field_shown', 'field_hidden'].includes((item as { type: string }).type)),
    ).toEqual([
      { type: 'field_shown', fieldKey: 'street' },
      { type: 'field_hidden', fieldKey: 'street' },
    ]);
  });

  it('sets the autocomplete attribute from the field and leaves it off otherwise', () => {
    harness.mount({ definition: autofill, onSubmit: () => {} });
    const attribute = (key: string) => document.querySelector(`[name="${key}"]`)?.getAttribute('autocomplete');
    expect(['first', 'mail', 'bio', 'born'].map(attribute)).toEqual(['given-name', 'email', 'off', 'bday']);
    expect(document.querySelector('[name="city"]')?.hasAttribute('autocomplete')).toBe(false);
  });

  it('uses the field token on autocomplete and radio fields, and off on an autocomplete field without one', () => {
    harness.mount({ definition: autofill, onSubmit: () => {} });
    const attributes = (selector: string) => [...document.querySelectorAll(selector)].map((node) => node.getAttribute('autocomplete'));
    expect(attributes('[name="state"]')).toEqual(['address-level1']);
    expect(attributes('[name="town"]')).toEqual(['off']);
    expect(attributes('[name="plan"]')).toEqual(['off', 'off']);
  });

  it('rejects a number autocomplete with a definition error', () => {
    const definition = {
      id: 'f',
      title: '',
      submit: { label: 'Send' },
      fields: [{ key: 'a', type: 'text', label: 'A', autocomplete: 123 }],
    };
    expect(() => harness.mount({ definition: definition as unknown as FormDefinition, onSubmit: () => {} })).toThrow(/autocomplete/);
  });

  it('gives each group item its own autofill section', () => {
    harness.mount({ definition: autofill, onSubmit: () => {} });
    const attributes = (key: string) =>
      [...document.querySelectorAll(`[name$=".${key}"]`)].map((node) => node.getAttribute('autocomplete'));
    expect(attributes('guest')).toEqual(['section-guests-0 name', 'section-guests-1 name']);
    expect(attributes('street')).toEqual(['section-guests-0-home street-address', 'section-guests-1-home street-address']);
    expect(attributes('code')).toEqual(['section-guests-0 one-time-code', 'section-guests-1 one-time-code']);
    expect(attributes('diet')).toEqual(['off', 'off']);
  });

  it('keeps line breaks of step, section and helper texts as plain text', () => {
    harness.mount({ definition: autofill, onSubmit: () => {} });
    const texts = ['.fh-step-progress__description', '.fh-field__helper:not(.fh-section__description)', '.fh-section__description'].map(
      (selector) => document.querySelector(selector),
    );
    expect(texts.map((node) => node?.textContent)).toEqual([
      'We keep it short.\nTwo minutes at most.',
      'Work address\nor personal',
      'First line\nSecond line',
    ]);
    expect(texts.map((node) => node?.children.length)).toEqual([0, 0, 0]);
  });
}
