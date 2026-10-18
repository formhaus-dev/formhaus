import { fireEvent, render } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { StrictMode } from 'react';
import { expect, it, vi } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';

const definition: FormDefinition = {
  id: 'events',
  title: '',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
    { id: 'two', title: 'Two', fields: [{ key: 'city', type: 'text', label: 'City' }] },
  ],
};

it('reports the form view once under StrictMode', () => {
  const onFormEvent = vi.fn();
  render(
    <StrictMode>
      <FormRenderer definition={definition} onSubmit={() => {}} onFormEvent={onFormEvent} />
    </StrictMode>,
  );
  expect(onFormEvent.mock.calls).toEqual([[{ type: 'form_viewed' }], [{ type: 'step_viewed', stepId: 'one', stepIndex: 0 }]]);
});

it('calls onFormEvent and the onAnalyticsEvent alias with every event', () => {
  const onFormEvent = vi.fn();
  const onAnalyticsEvent = vi.fn();
  render(<FormRenderer definition={definition} onSubmit={() => {}} onFormEvent={onFormEvent} onAnalyticsEvent={onAnalyticsEvent} />);
  expect(onFormEvent.mock.calls).toEqual([[{ type: 'form_viewed' }], [{ type: 'step_viewed', stepId: 'one', stepIndex: 0 }]]);
  expect(onAnalyticsEvent.mock.calls).toEqual(onFormEvent.mock.calls);
});

it('reports visibility changes after onFormEvent is added post-mount', () => {
  const conditional: FormDefinition = {
    id: 'late',
    title: '',
    submit: { label: 'Send' },
    fields: [
      { key: 'company', type: 'checkbox', label: 'Company' },
      { key: 'vat', type: 'text', label: 'VAT', show: [{ field: 'company', eq: true }] },
    ],
  };
  const onFormEvent = vi.fn();
  const { rerender, getByLabelText } = render(<FormRenderer definition={conditional} onSubmit={() => {}} />);
  rerender(<FormRenderer definition={conditional} onSubmit={() => {}} onFormEvent={onFormEvent} />);
  fireEvent.click(getByLabelText('Company'));
  expect(onFormEvent.mock.calls).toEqual([[{ type: 'field_shown', fieldKey: 'vat' }]]);
});
