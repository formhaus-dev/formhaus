import { render, screen } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { defineComponent, h } from 'vue';
import { expect, it } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

const definition: FormDefinition = { id: 'ids', title: '', submit: { label: 'Send' }, fields: [
  { key: 'email', type: 'email', label: 'Email', helperText: 'Work email' },
  { key: 'address.city name', type: 'text', label: 'City' },
  { key: 'plan', type: 'radio', label: 'Plan', options: [{ value: 'a b', label: 'A' }, { value: 'c', label: 'C' }] },
] };

it('gives every form its own field ids and keeps the key as name', () => {
  render(defineComponent({ setup: () => () => [h(FormRenderer, { definition }), h(FormRenderer, { definition })] }));
  const emails = screen.getAllByLabelText('Email');
  expect(emails).toHaveLength(2);
  expect(emails[0].id).not.toBe(emails[1].id);
  expect(emails.map((input) => input.getAttribute('name'))).toEqual(['email', 'email']);
  expect(document.getElementById(emails[1].getAttribute('aria-describedby')!)?.textContent).toBe('Work email');
  expect(screen.getAllByLabelText('City')[0].id).toMatch(/^[A-Za-z0-9_-]+$/);
  expect(screen.getAllByLabelText('A')[0].id).toMatch(/-plan-0$/);
});
