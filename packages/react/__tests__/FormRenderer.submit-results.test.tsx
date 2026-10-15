import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition, SubmitResult } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import account from '../../../examples/react-flat-api/src/account.json';
import { submitTo } from '../../../examples/react-flat-api/src/adapter';
import { createMockApi } from '../../../examples/react-flat-api/src/api';
import fixture from '../../core/fixtures/conformance/flat-api-steps.json';
import { FormRenderer } from '../src/FormRenderer';

const definition = account as FormDefinition;
const valid = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  accountType: 'personal',
  street: '1 Main St',
  postcode: '10115',
};
const idle = () => waitFor(() => expect(document.querySelector('form')?.getAttribute('aria-busy')).toBe('false'));
const field = (name: string) => screen.getByRole('textbox', { name: new RegExp(name) }) as HTMLInputElement;

async function toLastStep() {
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('heading', { name: 'Account' });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('heading', { name: 'Address' });
}

describe('FormRenderer submit results with a flat API', () => {
  it('uses the conformance definition', () => {
    expect(account).toEqual(fixture.definition);
  });

  it('walks three steps, maps errors from one flat response and succeeds after the fix', async () => {
    const api = createMockApi();
    const onAfterSubmit = vi.fn();
    render(
      <FormRenderer
        definition={definition}
        initialValues={{ ...valid, firstName: 'Ada1', postcode: '01067' }}
        onSubmit={submitTo(api)}
        onAfterSubmit={onAfterSubmit}
      />,
    );
    await toLastStep();
    fireEvent.click(screen.getByRole('button', { name: 'Open account' }));

    await screen.findByRole('heading', { name: 'About you' });
    await waitFor(() => expect(document.activeElement).toBe(field('First name')));
    expect(api.requests).toEqual([
      {
        first_name: 'Ada1',
        last_name: 'Lovelace',
        email: 'ada@example.com',
        account_type: 'personal',
        street: '1 Main St',
        postal_code: '01067',
      },
    ]);
    expect(screen.getByText('Use letters only').getAttribute('role')).toBe('alert');
    expect(field('First name').getAttribute('aria-describedby')).toContain('-error');
    expect(onAfterSubmit).not.toHaveBeenCalled();

    fireEvent.change(field('First name'), { target: { value: 'Ada' } });
    expect(screen.queryByText('Use letters only')).toBeNull();
    await toLastStep();
    expect(screen.getByText('We do not deliver to this postcode yet')).toBeDefined();
    expect(field('Postcode').value).toBe('01067');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByRole('heading', { name: 'Account' });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('We do not deliver to this postcode yet')).toBeDefined();

    fireEvent.change(field('Postcode'), { target: { value: '10115' } });
    fireEvent.click(screen.getByRole('button', { name: 'Open account' }));
    await waitFor(() => expect(onAfterSubmit).toHaveBeenCalledTimes(1));
    expect(api.requests).toHaveLength(2);
  });

  it('lands on the first step with focus on the field a toggle rejects, then shows a general error', async () => {
    const api = createMockApi();
    api.reject('email', true);
    const onAfterSubmit = vi.fn();
    render(<FormRenderer definition={definition} initialValues={valid} onSubmit={submitTo(api)} onAfterSubmit={onAfterSubmit} />);
    await toLastStep();
    fireEvent.click(screen.getByRole('button', { name: 'Open account' }));

    await screen.findByRole('heading', { name: 'About you' });
    await waitFor(() => expect(document.activeElement).toBe(field('Email')));
    expect(screen.getByText('Email rejected by the mock API')).toBeDefined();
    expect(onAfterSubmit).not.toHaveBeenCalled();

    api.reject('email', false);
    api.reject('general', true);
    await toLastStep();
    fireEvent.click(screen.getByRole('button', { name: 'Open account' }));
    expect((await screen.findByText('The service is down for maintenance')).closest('[role="alert"]')).not.toBeNull();
    expect(screen.queryByText('Email rejected by the mock API')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Address' })).toBeDefined();
    expect(api.requests).toHaveLength(2);
  });

  it('shows unknown keys and a hidden field error as form errors', async () => {
    const onSubmit = vi.fn(
      (): SubmitResult => ({ ok: false, errors: { account: 'Paused', companyName: 'Not registered' }, formErrors: ['Try again later'] }),
    );
    render(<FormRenderer definition={definition} initialValues={valid} onSubmit={onSubmit} />);
    await toLastStep();
    fireEvent.click(screen.getByRole('button', { name: 'Open account' }));
    const banner = await screen.findByRole('alert');
    expect(banner.textContent).toBe('Try again laterPausedNot registered');
    expect(screen.getByRole('heading', { name: 'Address' })).toBeDefined();
  });

  it('drops the error of a field hidden by another answer', async () => {
    const api = createMockApi();
    render(
      <FormRenderer
        definition={definition}
        initialValues={{ ...valid, accountType: 'business', companyName: 'Test Ltd', postcode: '01067' }}
        onSubmit={submitTo(api)}
      />,
    );
    await toLastStep();
    fireEvent.click(screen.getByRole('button', { name: 'Open account' }));
    expect(await screen.findByText('This company is not in the register')).toBeDefined();
    fireEvent.click(screen.getByLabelText('Personal'));
    expect(screen.queryByText('This company is not in the register')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('We do not deliver to this postcode yet')).toBeDefined();
  });

  it('keeps values and server errors after a network failure and shows the failure', async () => {
    const api = createMockApi();
    const onAfterSubmit = vi.fn();
    render(
      <FormRenderer
        definition={definition}
        initialValues={{ ...valid, postcode: '01067' }}
        onSubmit={submitTo(api)}
        onAfterSubmit={onAfterSubmit}
      />,
    );
    await toLastStep();
    fireEvent.click(screen.getByRole('button', { name: 'Open account' }));
    await screen.findByText('We do not deliver to this postcode yet');
    api.setOffline(true);
    fireEvent.click(screen.getByRole('button', { name: 'Open account' }));
    expect((await screen.findByText('Failed to fetch')).closest('[role="alert"]')).not.toBeNull();
    expect(screen.getByText('We do not deliver to this postcode yet')).toBeDefined();
    expect(field('Postcode').value).toBe('01067');
    expect(onAfterSubmit).not.toHaveBeenCalled();
  });

  it('sends one request for a double click and ignores a response after unmount', async () => {
    let resolve!: (result: SubmitResult) => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<SubmitResult>((done) => {
          resolve = done;
        }),
    );
    const onAfterSubmit = vi.fn();
    const { unmount } = render(
      <FormRenderer definition={definition} initialValues={valid} onSubmit={onSubmit} onAfterSubmit={onAfterSubmit} />,
    );
    await toLastStep();
    fireEvent.click(screen.getByRole('button', { name: 'Open account' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open account' }));
    fireEvent.submit(document.querySelector('form')!);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    unmount();
    await act(async () => resolve({ ok: true }));
    expect(onAfterSubmit).not.toHaveBeenCalled();
  });

  it('keeps old void handlers and the errors prop working', async () => {
    const onSubmit = vi.fn(async () => {});
    const onAfterSubmit = vi.fn();
    const { rerender } = render(
      <FormRenderer definition={definition} initialValues={valid} onSubmit={onSubmit} onAfterSubmit={onAfterSubmit} />,
    );
    await toLastStep();
    rerender(
      <FormRenderer
        definition={definition}
        initialValues={valid}
        errors={{ postcode: 'Bad', email: 'Taken' }}
        onSubmit={onSubmit}
        onAfterSubmit={onAfterSubmit}
      />,
    );
    await screen.findByRole('heading', { name: 'About you' });
    expect(await screen.findByText('Taken')).toBeDefined();
    await toLastStep();
    expect(screen.getByText('Bad')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Open account' }));
    await waitFor(() => expect(onAfterSubmit).toHaveBeenCalledTimes(1));
    await idle();
    expect(screen.queryByText('Bad')).toBeNull();
  });

  it('submits with Enter and moves focus to the first invalid field', async () => {
    render(
      <FormRenderer
        definition={definition}
        initialValues={valid}
        onSubmit={() => ({ ok: false, errors: { street: 'No such street', postcode: 'Unknown' } })}
      />,
    );
    await toLastStep();
    fireEvent.submit(field('Postcode').form!);
    await waitFor(() => expect(document.activeElement).toBe(field('Street')));
    expect(field('Street').getAttribute('aria-invalid')).toBe('true');
    expect(field('Postcode').getAttribute('aria-invalid')).toBe('true');
  });
});
