import { fireEvent, render, screen } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { expect, it } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';

const question = (key: string, labels: string[]) => ({ id: key, title: key, next: false as const, fields: [{
  key, type: 'radio', label: key, autoAdvance: true, options: labels.map((label) => ({ value: label, label })),
}] });

const definition: FormDefinition = { id: 'double', title: '', submit: { label: 'Send' }, steps: [
  question('first', ['A', 'B']), question('second', ['C', 'D']), question('third', ['E', 'F']),
] };

it('ignores the second click of a double-click on the next question', async () => {
  render(<FormRenderer definition={definition} onSubmit={() => {}} />);
  fireEvent.click(screen.getByLabelText('B'), { detail: 1 });
  const nextAnswer = await screen.findByLabelText('D');
  fireEvent.click(nextAnswer, { detail: 2 });
  await new Promise((done) => setTimeout(done, 0));
  expect(screen.getByLabelText('D')).toBeDefined();
  expect((screen.getByLabelText('D') as HTMLInputElement).checked).toBe(false);
});
