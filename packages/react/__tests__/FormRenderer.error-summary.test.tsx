import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { useLayoutEffect } from 'react';
import { describe, expect, it } from 'vitest';
import account from '../../../examples/react-flat-api/src/account.json';
import { FormRenderer } from '../src/FormRenderer';

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
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { name: title });
  }
  fireEvent.click(screen.getByRole('button', { name: 'Open account' }));
}

describe('error summary and step marks', () => {
  it('renders neither by default', async () => {
    render(<FormRenderer definition={definition} initialValues={valid} onSubmit={reject} />);
    await submitFromLastStep();
    await screen.findByText('Taken');
    expect(document.querySelector('.fh-error-summary')).toBeNull();
    expect(document.querySelector('.fh-step-progress__steps')).toBeNull();
  });

  it('lists every field error in step order with links that open the step and focus the field', async () => {
    render(<FormRenderer definition={definition} initialValues={valid} onSubmit={reject} errorSummary />);
    await submitFromLastStep();
    const summary = (await screen.findByText('Check these answers')).parentElement!;
    expect(summary.getAttribute('role')).toBe('alert');
    const links = within(summary).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Email: Taken', 'Account type: Not available', 'Postcode: Unknown postcode']);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /Email/ })));

    fireEvent.click(links[2]);
    await screen.findByRole('heading', { name: 'Address' });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /Postcode/ })));
    fireEvent.click(within(summary).getAllByRole('link')[1]);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Business' })));
    expect(links[2].getAttribute('href')).toMatch(/-postcode$/);
  });

  it('focuses the field when a summary link is clicked before the previous render settles', async () => {
    let clicked = false;
    const ClickOnCommit = () => {
      useLayoutEffect(() => {
        const link = document.querySelectorAll<HTMLElement>('.fh-error-summary__link')[2];
        if (clicked || !link || !document.activeElement?.id.endsWith('-email')) return;
        clicked = true;
        queueMicrotask(() => fireEvent.click(link));
      });
      return null;
    };
    render(<FormRenderer definition={definition} initialValues={valid} onSubmit={reject} errorSummary progressComponent={ClickOnCommit} />);
    for (const field of [/Company/, /Postcode/]) {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      await screen.findByRole('textbox', { name: field });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Open account' }));
    await waitFor(() => expect(clicked).toBe(true));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /Postcode/ })));
  });

  it('marks steps with errors and the current step', async () => {
    render(<FormRenderer definition={definition} initialValues={valid} onSubmit={reject} stepErrorMarks />);
    await submitFromLastStep();
    await screen.findByText('Taken');
    const items = [...document.querySelectorAll('.fh-step-progress__step')];
    expect(items.map((item) => item.textContent)).toEqual(['About you · Errors: 1', 'Account · Errors: 1', 'Address · Errors: 1']);
    expect(items[0].getAttribute('aria-current')).toBe('step');
    fireEvent.change(screen.getByRole('textbox', { name: /Email/ }), { target: { value: 'ada@lovelace.dev' } });
    expect(items[0].textContent).toBe('About you');
    expect(items[0].classList.contains('fh-step-progress__step--invalid')).toBe(false);
  });

  it('passes step status to a custom progress component', async () => {
    let seen: unknown;
    render(
      <FormRenderer
        definition={definition}
        initialValues={valid}
        onSubmit={reject}
        stepErrorMarks
        progressComponent={({ steps }) => {
          seen = steps;
          return null;
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() =>
      expect(seen).toEqual([
        { id: 'about', title: 'About you', errorCount: 0 },
        { id: 'account', title: 'Account', errorCount: 0 },
        { id: 'address', title: 'Address', errorCount: 0 },
      ]),
    );
  });
});

it('keeps focus when a summary link points to a custom field without the id', async () => {
  const Plain = ({ field, value, onChange }: { field: { label: string }; value: unknown; onChange: (value: unknown) => void }) => (
    <label>
      {field.label}
      <input aria-invalid="true" value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
  const plain: FormDefinition = {
    id: 'plain',
    title: '',
    submit: { label: 'Send' },
    fields: [
      { key: 'a', type: 'text', label: 'A' },
      { key: 'b', type: 'text', label: 'B' },
    ],
  };
  render(
    <FormRenderer
      definition={plain}
      components={{ text: Plain }}
      errorSummary
      onSubmit={() => ({ ok: false, errors: { a: 'bad a', b: 'bad b' } })}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  const link = await screen.findByRole('link', { name: 'B: bad b' });
  link.focus();
  fireEvent.click(link);
  await new Promise((done) => setTimeout(done));
  expect(document.activeElement).toBe(link);
});

it('does not mark a step called constructor', async () => {
  const reserved: FormDefinition = {
    id: 'reserved',
    title: '',
    submit: { label: 'Send' },
    steps: [
      { id: 'constructor', title: 'One', fields: [{ key: 'a', type: 'text', label: 'A' }] },
      { id: 'two', title: 'Two', fields: [{ key: 'b', type: 'text', label: 'B' }] },
    ],
  };
  render(<FormRenderer definition={reserved} onSubmit={() => {}} stepErrorMarks />);
  const items = [...document.querySelectorAll('.fh-step-progress__step')];
  expect(items.map((item) => item.textContent)).toEqual(['One', 'Two']);
});

it('focuses the field when a summary link is clicked on a single-step form', async () => {
  const flat: FormDefinition = {
    id: 'flat',
    title: '',
    submit: { label: 'Send' },
    fields: [
      { key: 'first', type: 'text', label: 'First' },
      { key: 'second', type: 'text', label: 'Second' },
    ],
  };
  render(
    <FormRenderer definition={flat} errorSummary onSubmit={() => ({ ok: false, errors: { first: 'Bad first', second: 'Bad second' } })} />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  const link = await screen.findByRole('link', { name: 'Second: Bad second' });
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /First/ })));
  link.focus();
  fireEvent.click(link);
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /Second/ })));
});
