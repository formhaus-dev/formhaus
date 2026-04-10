import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FormDefinition } from '@formhaus/core';
import { FormRenderer } from '../src/FormRenderer';

const definition: FormDefinition = {
  id: 'test',
  title: 'Test Form',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
    { key: 'email', type: 'email', label: 'Email' },
  ],
};

const selectDefinition: FormDefinition = {
  id: 'select-test',
  title: 'Select',
  submit: { label: 'Go' },
  fields: [
    {
      key: 'color',
      type: 'select',
      label: 'Color',
      placeholder: 'Pick one',
      options: [
        { value: 'red', label: 'Red' },
        { value: 'blue', label: 'Blue' },
      ],
    },
  ],
};

const multiStepDefinition: FormDefinition = {
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

describe('FormRenderer', () => {
  it('renders fields from definition', () => {
    render(<FormRenderer definition={definition} onSubmit={() => {}} />);
    expect(getInput('Name')).toBeDefined();
    expect(getInput('Email')).toBeDefined();
  });

  it('renders submit button', () => {
    render(<FormRenderer definition={definition} onSubmit={() => {}} />);
    expect(screen.getByText('Send')).toBeDefined();
  });

  it('shows validation error on submit with empty required field', () => {
    render(<FormRenderer definition={definition} onSubmit={() => {}} />);
    fireEvent.click(screen.getByText('Send'));
    expect(screen.getByText('This field is required')).toBeDefined();
  });

  it('calls onSubmit with values when valid', () => {
    const onSubmit = vi.fn();
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);
    fireEvent.change(getInput('Name'), { target: { value: 'John' } });
    fireEvent.click(screen.getByText('Send'));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
  });

  it('updates field value on change', () => {
    render(<FormRenderer definition={definition} onSubmit={() => {}} />);
    const input = getInput('Name');
    fireEvent.change(input, { target: { value: 'Jane' } });
    expect(input.value).toBe('Jane');
  });

  it('calls onFieldChange callback', () => {
    const onFieldChange = vi.fn();
    render(<FormRenderer definition={definition} onSubmit={() => {}} onFieldChange={onFieldChange} />);
    fireEvent.change(getInput('Name'), { target: { value: 'X' } });
    expect(onFieldChange).toHaveBeenCalledWith('name', 'X', expect.any(Object));
  });

  it('renders select with options', () => {
    render(<FormRenderer definition={selectDefinition} onSubmit={() => {}} />);
    expect(screen.getByText('Red')).toBeDefined();
    expect(screen.getByText('Blue')).toBeDefined();
  });

  it('displays external errors', () => {
    const { rerender } = render(<FormRenderer definition={definition} onSubmit={() => {}} />);
    rerender(<FormRenderer definition={definition} onSubmit={() => {}} errors={{ name: 'Taken' }} />);
    expect(screen.getByText('Taken')).toBeDefined();
  });

  it('disables fields when loading', () => {
    render(<FormRenderer definition={definition} onSubmit={() => {}} loading={true} />);
    expect(getInput('Name').disabled).toBe(true);
  });
});

describe('FormRenderer multi-step', () => {
  it('shows step 1 fields only', () => {
    render(<FormRenderer definition={multiStepDefinition} onSubmit={() => {}} />);
    expect(getInput('First')).toBeDefined();
    expect(screen.queryByRole('textbox', { name: /Second/ })).toBeNull();
  });

  it('shows step progress', () => {
    render(<FormRenderer definition={multiStepDefinition} onSubmit={() => {}} />);
    expect(screen.getAllByText(/Step/).length).toBeGreaterThan(0);
  });

  it('validates before advancing', async () => {
    render(<FormRenderer definition={multiStepDefinition} onSubmit={() => {}} />);
    fireEvent.click(screen.getByText('Continue'));
    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeDefined();
    });
    expect(screen.queryByRole('textbox', { name: /Second/ })).toBeNull();
  });

  it('advances to step 2 when valid', async () => {
    render(<FormRenderer definition={multiStepDefinition} onSubmit={() => {}} />);
    fireEvent.change(getInput('First'), { target: { value: 'ok' } });
    fireEvent.click(screen.getByText('Continue'));
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /Second/ })).toBeDefined();
    });
  });

  it('calls onStepChange when advancing', async () => {
    const onStepChange = vi.fn();
    render(<FormRenderer definition={multiStepDefinition} onSubmit={() => {}} onStepChange={onStepChange} />);
    fireEvent.change(getInput('First'), { target: { value: 'ok' } });
    fireEvent.click(screen.getByText('Continue'));
    await waitFor(() => {
      expect(onStepChange).toHaveBeenCalledWith('step2', 'next');
    });
  });
});
