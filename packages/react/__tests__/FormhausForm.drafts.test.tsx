import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, expect, it, vi } from 'vitest';
import { FormhausForm } from '../src/cloud';

const definition: FormDefinition = {
  id: 'apply',
  title: 'Apply',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'notes', type: 'textarea', label: 'Notes' },
    { key: 'secret', type: 'password', label: 'Secret' },
    { key: 'ref', type: 'hidden', defaultValue: 'ad' },
  ],
};

const initialForm = { version: 3, definition };
const draft = () => JSON.parse(sessionStorage.getItem('formhaus:draft:abc') ?? 'null')?.values;
const type = (name: string, value: string) => fireEvent.change(screen.getByLabelText(name), { target: { value } });

afterEach(() => vi.unstubAllGlobals());

it('keeps a session draft by default and restores it after a remount', async () => {
  vi.stubGlobal('fetch', vi.fn());
  const first = render(<FormhausForm id="abc" initialForm={initialForm} />);
  type('Name', 'Ada');
  type('Secret', 'hunter2');
  expect(draft()).toEqual({ name: 'Ada' });
  first.unmount();
  render(<FormhausForm id="abc" initialForm={initialForm} />);
  await waitFor(() => expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Ada'));
});

it('never writes password or hidden values to the draft', () => {
  vi.stubGlobal('fetch', vi.fn());
  render(<FormhausForm id="abc" initialForm={initialForm} />);
  type('Secret', 'hunter2');
  type('Name', 'Ada');
  expect(sessionStorage.getItem('formhaus:draft:abc')).not.toMatch(/hunter2|"ref"/);
});

it('clears the draft after a successful submit', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 's1', values: {} }) }));
  render(<FormhausForm id="abc" initialForm={initialForm} />);
  type('Name', 'Ada');
  expect(draft()).toEqual({ name: 'Ada' });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  await screen.findByText('Thank you. Your response was submitted.');
  expect(sessionStorage.getItem('formhaus:draft:abc')).toBeNull();
});

it('keeps no draft with draftStore false', () => {
  vi.stubGlobal('fetch', vi.fn());
  render(<FormhausForm id="abc" initialForm={initialForm} draftStore={false} />);
  type('Name', 'Ada');
  expect(sessionStorage.length).toBe(0);
});

it('leaves the draftExclude fields out of the draft', () => {
  vi.stubGlobal('fetch', vi.fn());
  render(<FormhausForm id="abc" initialForm={initialForm} draftExclude={['notes']} />);
  type('Name', 'Ada');
  type('Notes', 'Private history');
  expect(draft()).toEqual({ name: 'Ada' });
});
