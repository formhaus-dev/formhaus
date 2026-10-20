import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue';
import { defineComponent } from 'vue';
import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import account from '../../../examples/react-flat-api/src/account.json';
import FormRenderer from '../src/FormRenderer.vue';

const definition = account as FormDefinition;
const valid = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  accountType: 'business',
  companyName: 'Engines',
  street: '1 Main St',
  postcode: '10115',
};
const reject = () => ({ ok: false as const, errors: { postcode: 'Unknown postcode', accountType: 'Not available', email: 'Taken' } });

async function submitFromLastStep() {
  for (const title of ['Account', 'Address']) {
    await fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { name: title });
  }
  await fireEvent.click(screen.getByRole('button', { name: 'Open account' }));
}

describe('Vue error summary and step marks', () => {
  it('shows the summary and no step marks by default', async () => {
    render(FormRenderer, { props: { definition, initialValues: valid, onSubmit: reject } });
    await submitFromLastStep();
    await screen.findByText('Check these answers');
    expect(document.querySelector('.fh-step-progress__steps')).toBeNull();
  });

  it('hides the summary with errorSummary false', async () => {
    render(FormRenderer, { props: { definition, initialValues: valid, onSubmit: reject, errorSummary: false } });
    await submitFromLastStep();
    await screen.findByText('Taken');
    expect(document.querySelector('.fh-error-summary')).toBeNull();
  });

  it('lists every field error in step order with links that open the step and focus the field', async () => {
    render(FormRenderer, { props: { definition, initialValues: valid, onSubmit: reject, errorSummary: true } });
    await submitFromLastStep();
    const summary = (await screen.findByText('Check these answers')).parentElement!;
    expect(summary.getAttribute('role')).toBe('alert');
    const links = within(summary).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Email: Taken', 'Account type: Not available', 'Postcode: Unknown postcode']);
    await waitFor(() => expect(document.activeElement).toBe(document.querySelector('.fh-error-summary')));

    await fireEvent.click(links[2]);
    await screen.findByRole('heading', { name: 'Address' });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /Postcode/ })));
    await fireEvent.click(within(summary).getAllByRole('link')[1]);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Business' })));
    expect(links[2].getAttribute('href')).toMatch(/-postcode$/);
  });

  it('marks steps with errors and the current step', async () => {
    render(FormRenderer, { props: { definition, initialValues: valid, onSubmit: reject, stepErrorMarks: true } });
    await submitFromLastStep();
    await screen.findByText('Taken');
    const items = [...document.querySelectorAll('.fh-step-progress__step')];
    expect(items.map((item) => item.textContent)).toEqual(['About you · Errors: 1', 'Account · Errors: 1', 'Address · Errors: 1']);
    expect(items[0].getAttribute('aria-current')).toBe('step');
    await fireEvent.update(screen.getByRole('textbox', { name: /Email/ }), 'ada@lovelace.dev');
    expect(items[0].textContent).toBe('About you');
    expect(items[0].classList.contains('fh-step-progress__step--invalid')).toBe(false);
  });

  it('passes step status to a custom progress component', async () => {
    let seen: unknown;
    const progressComponent = defineComponent({
      props: ['steps'],
      setup: (props) => () => {
        seen = props.steps;
        return null;
      },
    });
    render(FormRenderer, { props: { definition, initialValues: valid, onSubmit: reject, stepErrorMarks: true, progressComponent } });
    await fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() =>
      expect(seen).toEqual([
        { id: 'about', title: 'About you', errorCount: 0 },
        { id: 'account', title: 'Account', errorCount: 0 },
        { id: 'address', title: 'Address', errorCount: 0 },
      ]),
    );
  });
});
