import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import * as entry from '../src';

const definition: FormDefinition = {
  id: 'contract',
  title: '',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'First step', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
    { id: 'two', title: 'Second', fields: [] },
  ],
};

it('renders the step title at the heading level', () => {
  render(<entry.FormRenderer definition={definition} onSubmit={() => {}} headingLevel={4} />);
  expect(screen.getByRole('heading', { level: 4, name: 'First step' })).toBeDefined();
  render(<entry.FormRenderer definition={definition} onSubmit={() => {}} />);
  expect(screen.getByRole('heading', { level: 2, name: 'First step' })).toBeDefined();
});

it('exports FormhausField and every built-in field', () => {
  function Host() {
    const [value, setValue] = useState<unknown>('');
    return <entry.FormhausField field={{ key: 'name', type: 'text', label: 'Name' }} value={value} onChange={setValue} onBlur={() => {}} />;
  }
  render(<Host />);
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
  expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Ada');
  for (const name of [
    'TextField',
    'TextareaField',
    'SelectField',
    'AutocompleteField',
    'MultiselectField',
    'CheckboxField',
    'RadioField',
    'SwitchField',
    'FileField',
    'DateField',
    'DateTimeField',
    'defaultFieldComponents',
  ]) {
    expect(entry[name as keyof typeof entry]).toBeDefined();
  }
});

it('creates a new engine when the definition object changes', () => {
  const { rerender } = render(<entry.FormRenderer definition={definition} onSubmit={() => {}} />);
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
  rerender(<entry.FormRenderer definition={{ ...definition }} onSubmit={() => {}} />);
  expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('');
});

it('keeps a string file value as an app reference without showing or fetching it', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  const onSubmit = vi.fn();
  const reference = 'file:///etc/passwd';
  const files: FormDefinition = { id: 'files', title: '', submit: { label: 'Send' }, fields: [{ key: 'cv', type: 'file', label: 'CV' }] };
  const { container } = render(<entry.FormRenderer definition={files} initialValues={{ cv: reference }} onSubmit={onSubmit} />);
  expect((screen.getByLabelText('CV') as HTMLInputElement).value).toBe('');
  expect(container.querySelectorAll('a, img, iframe, object, embed')).toHaveLength(0);
  expect(container.innerHTML).not.toContain(reference);
  fireEvent.click(screen.getByText('Send'));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ cv: reference }, []));
  expect(fetchMock).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});
