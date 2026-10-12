import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from '../Input/Input';
import { Field } from './Field';

describe('Field', () => {
  it('labels its control and wires hint, error and required', () => {
    render(
      <Field label="Webhook URL" hint="HTTPS only." error="Enter a valid URL." required>
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: /Webhook URL/ });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('HTTPS only. Enter a valid URL.');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid URL.');
  });

  it('keeps a hidden label accessible', () => {
    render(
      <Field label="Filter forms" hideLabel>
        <Input />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Filter forms' })).not.toHaveAttribute('aria-invalid');
  });
});
