import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';

const definition: FormDefinition = {
  id: 'steps',
  title: 'Steps',
  submit: { label: 'Submit' },
  steps: [
    {
      id: 'step1',
      title: 'Step 1',
      fields: [{ key: 'first', type: 'text', label: 'First', validation: { required: true } }],
    },
    {
      id: 'step2',
      title: 'Step 2',
      fields: [{ key: 'second', type: 'text', label: 'Second' }],
    },
  ],
};

function getInput(name: string): HTMLInputElement {
  return screen.getByRole('textbox', { name: new RegExp(name) });
}

describe('FormRenderer multi-step', () => {
  it('shows step 1 fields only', () => {
    render(<FormRenderer definition={definition} onSubmit={() => {}} />);
    expect(getInput('First')).toBeDefined();
    expect(screen.queryByRole('textbox', { name: /Second/ })).toBeNull();
  });

  it('shows step progress', () => {
    render(<FormRenderer definition={definition} onSubmit={() => {}} />);
    expect(screen.getAllByText(/Step/).length).toBeGreaterThan(0);
  });

  it('validates before advancing', async () => {
    render(<FormRenderer definition={definition} onSubmit={() => {}} />);
    fireEvent.click(screen.getByText('Continue'));
    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeDefined();
    });
    expect(screen.queryByRole('textbox', { name: /Second/ })).toBeNull();
  });

  it('advances to step 2 when valid', async () => {
    render(<FormRenderer definition={definition} onSubmit={() => {}} />);
    fireEvent.change(getInput('First'), { target: { value: 'ok' } });
    fireEvent.click(screen.getByText('Continue'));
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /Second/ })).toBeDefined();
    });
  });

  it('calls onStepChange when advancing', async () => {
    const onStepChange = vi.fn();
    render(
      <FormRenderer
        definition={definition}
        onSubmit={() => {}}
        onStepChange={onStepChange}
      />,
    );
    fireEvent.change(getInput('First'), { target: { value: 'ok' } });
    fireEvent.click(screen.getByText('Continue'));
    await waitFor(() => {
      expect(onStepChange).toHaveBeenCalledWith('step2', 'next');
    });
  });
});
