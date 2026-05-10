import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { FormDefinition } from '@formhaus/core';
import { FormRenderer } from '../src/FormRenderer';

const definition: FormDefinition = {
  id: 'ssr-test',
  title: 'SSR',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'email', type: 'email', label: 'Email' },
  ],
};

const multiStepDefinition: FormDefinition = {
  id: 'ssr-steps',
  title: 'SSR Steps',
  submit: { label: 'Submit' },
  steps: [
    {
      id: 'step1',
      title: 'Step 1',
      fields: [{ key: 'first', type: 'text', label: 'First' }],
    },
    {
      id: 'step2',
      title: 'Step 2',
      fields: [{ key: 'second', type: 'text', label: 'Second' }],
    },
  ],
};

describe('FormRenderer SSR', () => {
  it('renders to string without throwing', () => {
    expect(() => renderToString(<FormRenderer definition={definition} onSubmit={() => {}} />)).not.toThrow();
  });

  it('emits markup containing field labels on the server', () => {
    const html = renderToString(<FormRenderer definition={definition} onSubmit={() => {}} />);
    expect(html).toContain('Name');
    expect(html).toContain('Email');
    expect(html).toContain('Send');
  });

  it('renders multi-step initial step on the server', () => {
    const html = renderToString(<FormRenderer definition={multiStepDefinition} onSubmit={() => {}} />);
    expect(html).toContain('First');
    expect(html).not.toContain('Second');
  });

  it('respects initialValues during server render', () => {
    const html = renderToString(
      <FormRenderer definition={definition} initialValues={{ name: 'Ada' }} onSubmit={() => {}} />,
    );
    expect(html).toContain('value="Ada"');
  });
});
