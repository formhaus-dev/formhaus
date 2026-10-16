import { render, screen } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, expect, it, vi } from 'vitest';
import { FormRenderer } from '../src';

const definition: FormDefinition = {
  id: 'shim',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'score', type: 'x-score', label: 'Score' },
  ],
};

afterEach(() => vi.unstubAllGlobals());

it('renders when a process shim has no env', () => {
  vi.stubGlobal('process', {});
  render(<FormRenderer definition={definition} onSubmit={() => {}} />);
  expect(screen.getByLabelText('Name')).toBeDefined();
});
