import { render } from '@testing-library/react';
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

it('prefers onFormEvent over the onAnalyticsEvent alias', () => {
  const onFormEvent = vi.fn();
  const onAnalyticsEvent = vi.fn();
  render(<FormRenderer definition={definition} onSubmit={() => {}} onFormEvent={onFormEvent} onAnalyticsEvent={onAnalyticsEvent} />);
  expect(onFormEvent).toHaveBeenCalledWith({ type: 'form_viewed' });
  expect(onAnalyticsEvent).not.toHaveBeenCalled();
});
