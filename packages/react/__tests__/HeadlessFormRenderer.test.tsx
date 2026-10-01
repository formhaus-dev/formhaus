import { fireEvent, render, screen } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';
import { HeadlessFormRenderer } from '../src/HeadlessFormRenderer';
import type { FieldComponentProps, FormActionsProps, FormStepProgressProps } from '../src/types';

function CustomText({ field, value, onChange }: FieldComponentProps) {
  return (
    <input
      data-testid={`custom-${field.key}`}
      value={(value as string | undefined) ?? ''}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function CustomActions({ primaryLabel, onPrimary, onCancel }: FormActionsProps) {
  return (
    <div>
      <button type="button" onClick={onPrimary}>{primaryLabel}</button>
      <button type="button" onClick={onCancel}>Custom cancel</button>
    </div>
  );
}

function CustomProgress({ current, total }: FormStepProgressProps) {
  return <p data-testid="custom-progress">{`${current}/${total}`}</p>;
}

const definition: FormDefinition = {
  id: 'headless',
  title: 'Headless',
  submit: { label: 'Send' },
  cancel: { label: 'Cancel' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'email', type: 'email', label: 'Email' },
  ],
};

const steps: FormDefinition = {
  id: 'headless-steps',
  title: 'Steps',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
    { id: 'two', title: 'Two', fields: [{ key: 'city', type: 'text', label: 'City' }] },
  ],
};

describe('HeadlessFormRenderer', () => {
  it('renders mapped custom fields', () => {
    const { container } = render(
      <HeadlessFormRenderer
        definition={definition}
        components={{ text: CustomText, email: CustomText }}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByTestId('custom-name')).toBeDefined();
    expect(screen.getByTestId('custom-email')).toBeDefined();
    expect(container.querySelector('.fh-field__input')).toBeNull();
  });

  it('renders the unsupported fallback for an unmapped type', () => {
    const { container } = render(
      <HeadlessFormRenderer definition={definition} components={{ text: CustomText }} onSubmit={() => {}} />,
    );
    expect(screen.getByText('Unsupported field type: email')).toBeDefined();
    expect(container.querySelectorAll('input')).toHaveLength(1);
    expect(container.querySelector('.fh-field__input')).toBeNull();
  });

  it('renders no actions or progress when none are passed', () => {
    const { container } = render(
      <HeadlessFormRenderer definition={steps} components={{ text: CustomText }} onSubmit={() => {}} />,
    );
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('.fh-step-progress')).toBeNull();
  });

  it('renders the custom actions and progress when passed', async () => {
    const onStepChange = vi.fn();
    render(
      <HeadlessFormRenderer
        definition={steps}
        components={{ text: CustomText }}
        ActionsComponent={CustomActions}
        ProgressComponent={CustomProgress}
        onStepChange={onStepChange}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByTestId('custom-progress').textContent).toBe('1/2');
    fireEvent.click(screen.getByText('Continue'));
    expect(await screen.findByTestId('custom-city')).toBeDefined();
    expect(screen.getByTestId('custom-progress').textContent).toBe('2/2');
    expect(onStepChange).toHaveBeenCalledWith('two', 'next');
  });
});

describe('FormRenderer built-in fallbacks', () => {
  it('falls back to native fields, actions and progress', () => {
    const { container } = render(
      <FormRenderer definition={steps} components={{ text: undefined }} onSubmit={() => {}} />,
    );
    expect(container.querySelector('.fh-field__input')).not.toBeNull();
    expect(container.querySelector('.fh-step-progress')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDefined();
  });

  it('mixes custom and native fields', () => {
    render(<FormRenderer definition={definition} components={{ text: CustomText }} onSubmit={() => {}} />);
    expect(screen.getByTestId('custom-name')).toBeDefined();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeDefined();
    expect(screen.queryByText(/Unsupported field type/)).toBeNull();
  });

  it('passes every callback through to the headless core', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const onFieldChange = vi.fn();
    render(
      <FormRenderer
        definition={definition}
        components={{ text: CustomText }}
        ActionsComponent={CustomActions}
        onSubmit={onSubmit}
        onCancel={onCancel}
        onFieldChange={onFieldChange}
      />,
    );
    fireEvent.change(screen.getByTestId('custom-name'), { target: { value: 'Ann' } });
    fireEvent.click(screen.getByText('Send'));
    fireEvent.click(screen.getByText('Custom cancel'));

    expect(onFieldChange).toHaveBeenCalledWith('name', 'Ann', { name: 'Ann' });
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Ann' });
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
