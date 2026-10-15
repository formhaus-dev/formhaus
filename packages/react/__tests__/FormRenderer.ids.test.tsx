import { render, screen } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { expect, it } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';

const definition: FormDefinition = {
  id: 'ids',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'email', type: 'email', label: 'Email', helperText: 'Work email' },
    { key: 'address.city name', type: 'text', label: 'City' },
    {
      key: 'plan',
      type: 'radio',
      label: 'Plan',
      options: [
        { value: 'a b', label: 'A' },
        { value: 'c', label: 'C' },
      ],
    },
  ],
};

it('gives every form its own field ids and keeps the key as name', () => {
  render(
    <>
      <FormRenderer definition={definition} onSubmit={() => {}} />
      <FormRenderer definition={definition} onSubmit={() => {}} />
    </>,
  );
  const emails = screen.getAllByLabelText('Email');
  expect(emails).toHaveLength(2);
  expect(emails[0].id).not.toBe(emails[1].id);
  expect(emails.map((input) => input.getAttribute('name'))).toEqual(['email', 'email']);
  expect(document.getElementById(emails[1].getAttribute('aria-describedby')!)?.textContent).toBe('Work email');
  const city = screen.getAllByLabelText('City')[0];
  expect(city.id).toMatch(/^[A-Za-z0-9_-]+$/);
  expect(screen.getAllByLabelText('A')[0].id).toMatch(/-plan-0$/);
});
