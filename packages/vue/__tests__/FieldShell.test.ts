import { render } from '@testing-library/vue';
import type { FormField } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import CheckboxField from '../src/fields/CheckboxField.vue';
import RadioField from '../src/fields/RadioField.vue';
import TextField from '../src/fields/TextField.vue';

const options = [{ value: 'a', label: 'A' }];

describe('FieldShell', () => {
  it('renders the label, the input and the helper in order', () => {
    const field: FormField = { key: 'name', type: 'text', label: 'Name', helperText: 'Help' };
    const { container } = render(TextField, { props: { field, value: '' } });
    const root = container.firstElementChild!;

    expect(root.className).toBe('fh-field');
    expect([...root.children].map((el) => el.tagName)).toEqual(['LABEL', 'INPUT', 'P']);
    expect(root.querySelector('label')!.getAttribute('for')).toBe('fh-field-name');
    expect(root.querySelector('input')!.getAttribute('aria-describedby')).toBe('fh-field-name-helper');
    expect(root.querySelector('p')!.id).toBe('fh-field-name-helper');
  });

  it('puts the checkbox label after the input inside the wrapper', () => {
    const field: FormField = { key: 'agree', type: 'checkbox', label: 'Agree' };
    const { container } = render(CheckboxField, { props: { field, value: false, error: 'Required' } });
    const root = container.firstElementChild!;
    const wrapper = root.querySelector('.fh-field__checkbox-wrapper')!;

    expect(root.className).toBe('fh-field fh-field--checkbox');
    expect([...wrapper.children].map((el) => el.tagName)).toEqual(['INPUT', 'LABEL']);
    expect(wrapper.querySelector('input')!.getAttribute('aria-invalid')).toBe('true');
    expect(root.lastElementChild!.className).toBe('fh-field__error');
  });

  it('describes the radio fieldset instead of each option', () => {
    const field: FormField = { key: 'plan', type: 'radio', label: 'Plan', options };
    const { container } = render(RadioField, { props: { field, value: 'a', error: 'Pick one' } });
    const root = container.firstElementChild!;

    expect(root.tagName).toBe('FIELDSET');
    expect(root.className).toBe('fh-field fh-field--radio');
    expect(root.getAttribute('aria-invalid')).toBe('true');
    expect(root.getAttribute('aria-describedby')).toBe('fh-field-plan-helper');
    expect(root.querySelector('legend')!.textContent!.trim()).toBe('Plan');
    expect(root.querySelector('input')!.hasAttribute('aria-describedby')).toBe(false);
  });
});
