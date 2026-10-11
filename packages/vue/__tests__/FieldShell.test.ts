import { render } from '@testing-library/vue';
import type { FormField } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import CheckboxField from '../src/fields/CheckboxField.vue';
import MultiselectField from '../src/fields/MultiselectField.vue';
import RadioField from '../src/fields/RadioField.vue';
import TextField from '../src/fields/TextField.vue';

const options = [{ value: 'a', label: 'A' }];

describe('FieldShell', () => {
  it('renders the label, the helper, the input and the error in order', () => {
    const field: FormField = { key: 'name', type: 'text', label: 'Name', helperText: 'Help' };
    const { container } = render(TextField, { props: { field, value: '', error: 'Required' } });
    const root = container.firstElementChild!;

    expect(root.className).toBe('fh-field');
    expect([...root.children].map((el) => el.className)).toEqual(['fh-field__label', 'fh-field__helper', 'fh-field__input', 'fh-field__error']);
    expect(root.querySelector('label')!.getAttribute('for')).toBe('fh-field-name');
    expect(root.querySelector('input')!.getAttribute('aria-describedby')).toBe('fh-field-name-helper fh-field-name-error');
    expect(root.querySelector('.fh-field__helper')!.id).toBe('fh-field-name-helper');
    expect(root.querySelector('.fh-field__error')!.id).toBe('fh-field-name-error');
  });

  it('puts the checkbox label after the input inside the wrapper', () => {
    const field: FormField = { key: 'agree', type: 'checkbox', label: 'Agree', helperText: 'Help' };
    const { container } = render(CheckboxField, { props: { field, value: false, error: 'Required' } });
    const root = container.firstElementChild!;
    const wrapper = root.querySelector('.fh-field__checkbox-wrapper')!;

    expect(root.className).toBe('fh-field fh-field--checkbox');
    expect([...wrapper.children].map((el) => el.tagName)).toEqual(['INPUT', 'LABEL']);
    expect([...root.children].map((el) => el.className)).toEqual(['fh-field__checkbox-wrapper', 'fh-field__helper', 'fh-field__error']);
    expect(wrapper.querySelector('input')!.getAttribute('aria-invalid')).toBe('true');
    expect(wrapper.querySelector('input')!.getAttribute('aria-describedby')).toBe('fh-field-agree-helper fh-field-agree-error');
    expect(root.lastElementChild!.className).toBe('fh-field__error');
    expect(root.lastElementChild!.getAttribute('role')).toBe('alert');
  });

  it('describes the radio fieldset instead of each option', () => {
    const field: FormField = { key: 'plan', type: 'radio', label: 'Plan', helperText: 'Help', options };
    const { container } = render(RadioField, { props: { field, value: 'a', error: 'Pick one' } });
    const root = container.firstElementChild!;

    expect(root.tagName).toBe('FIELDSET');
    expect(root.className).toBe('fh-field fh-field--radio');
    expect(root.getAttribute('aria-invalid')).toBe('true');
    expect(root.getAttribute('aria-describedby')).toBe('fh-field-plan-helper fh-field-plan-error');
    expect([...root.children].map((el) => el.className)).toEqual(['fh-field__label', 'fh-field__helper', 'fh-field__radio-group', 'fh-field__error']);
    expect(root.querySelector('legend')!.textContent!.trim()).toBe('Plan');
    expect(root.querySelector('input')!.hasAttribute('aria-describedby')).toBe(false);
  });

  it('stacks options unless the field asks for the inline layout', () => {
    const field: FormField = { key: 'plan', type: 'radio', label: 'Plan', options };
    const stacked = render(RadioField, { props: { field, value: '' } });
    const inline = render(MultiselectField, { props: { field: { ...field, type: 'multiselect', layout: 'inline' }, value: [] } });

    expect(stacked.container.querySelector('.fh-field__radio-group')!.className).toBe('fh-field__radio-group');
    expect(inline.container.querySelector('.fh-field__multiselect-group')!.className).toBe('fh-field__multiselect-group fh-field__multiselect-group--inline');
  });
});
