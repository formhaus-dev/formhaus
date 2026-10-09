import { render } from '@testing-library/react';
import type { FormField } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { CheckboxField } from '../src/fields/CheckboxField';
import { RadioField } from '../src/fields/RadioField';
import { TextField } from '../src/fields/TextField';

const noop = () => {};
const options = [{ value: 'a', label: 'A' }];

describe('FieldShell', () => {
  it('renders the label, the input and the helper in order', () => {
    const field: FormField = { key: 'name', type: 'text', label: 'Name', helperText: 'Help', validation: { required: true } };
    const { container } = render(<TextField field={field} value="" onChange={noop} onBlur={noop} />);
    const root = container.firstElementChild!;

    expect(root.className).toBe('fh-field');
    expect([...root.children].map((el) => el.tagName)).toEqual(['LABEL', 'INPUT', 'P']);
    expect(root.querySelector('label')!.getAttribute('for')).toBe('name');
    expect(root.querySelector('.fh-field__required')).not.toBeNull();
    expect(root.querySelector('input')!.getAttribute('aria-describedby')).toBe('name-helper');
    expect(root.querySelector('p')!.id).toBe('name-helper');
  });

  it('puts the checkbox label after the input inside the wrapper', () => {
    const field: FormField = { key: 'agree', type: 'checkbox', label: 'Agree' };
    const { container } = render(<CheckboxField field={field} value={false} error="Required" onChange={noop} onBlur={noop} />);
    const root = container.firstElementChild!;
    const wrapper = root.querySelector('.fh-field__checkbox-wrapper')!;

    expect(root.className).toBe('fh-field fh-field--checkbox');
    expect([...wrapper.children].map((el) => el.tagName)).toEqual(['INPUT', 'LABEL']);
    expect(wrapper.querySelector('input')!.getAttribute('aria-describedby')).toBe('agree-error');
    expect(root.lastElementChild!.getAttribute('role')).toBe('alert');
  });

  it('describes the radio fieldset instead of each option', () => {
    const field: FormField = { key: 'plan', type: 'radio', label: 'Plan', options };
    const { container } = render(<RadioField field={field} value="a" error="Pick one" onChange={noop} onBlur={noop} />);
    const root = container.firstElementChild!;

    expect(root.tagName).toBe('FIELDSET');
    expect(root.className).toBe('fh-field fh-field--radio');
    expect(root.getAttribute('aria-invalid')).toBe('true');
    expect(root.getAttribute('aria-describedby')).toBe('plan-error');
    expect(root.querySelector('legend')!.textContent).toBe('Plan');
    expect(root.querySelector('input')!.hasAttribute('aria-describedby')).toBe(false);
  });
});
