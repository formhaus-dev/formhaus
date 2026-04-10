import { render, screen, fireEvent } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '@formhaus/core';
import FormRenderer from '../src/FormRenderer.vue';

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
    render(FormRenderer, { props: { definition } });
    expect(getInput('Name')).toBeDefined();
    expect(getInput('Email')).toBeDefined();
  });

  it('renders submit button', () => {
    render(FormRenderer, { props: { definition } });
    expect(screen.getByText('Send')).toBeDefined();
  });

  it('shows validation error on submit with empty required field', async () => {
    render(FormRenderer, { props: { definition } });
    await fireEvent.click(screen.getByText('Send'));
    expect(screen.getByText('This field is required')).toBeDefined();
  });

  it('updates field value on input', async () => {
    render(FormRenderer, { props: { definition } });
    const input = getInput('Name');
    await fireEvent.update(input, 'Jane');
    expect(input.value).toBe('Jane');
  });

  it('renders select with options', () => {
    render(FormRenderer, { props: { definition: selectDefinition } });
    expect(screen.getByText('Red')).toBeDefined();
    expect(screen.getByText('Blue')).toBeDefined();
  });

  it('disables fields when loading', () => {
    render(FormRenderer, { props: { definition, loading: true } });
    expect(getInput('Name').disabled).toBe(true);
  });
});

describe('FormRenderer multi-step', () => {
  it('shows step 1 fields only', () => {
    render(FormRenderer, { props: { definition: multiStepDefinition } });
    expect(getInput('First')).toBeDefined();
    expect(screen.queryByRole('textbox', { name: /Second/ })).toBeNull();
  });

  it('shows step progress', () => {
    render(FormRenderer, { props: { definition: multiStepDefinition } });
    expect(screen.getAllByText(/Step/).length).toBeGreaterThan(0);
  });

  it('validates before advancing', async () => {
    render(FormRenderer, { props: { definition: multiStepDefinition } });
    await fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('This field is required')).toBeDefined();
    expect(screen.queryByRole('textbox', { name: /Second/ })).toBeNull();
  });

  it('advances to step 2 when valid', async () => {
    render(FormRenderer, { props: { definition: multiStepDefinition } });
    await fireEvent.update(getInput('First'), 'ok');
    await fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByRole('textbox', { name: /Second/ })).toBeDefined();
  });
});
