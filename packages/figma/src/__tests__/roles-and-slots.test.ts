import { describe, expect, it } from 'vitest';
import { ROLES, roleForField } from '../roles';
import { slotForName } from '../text-slots';

const field = (type: string, options?: { value: string; label: string }[]) => ({ key: 'k', type, label: 'L', options });

describe('roleForField', () => {
  it.each([
    ['text', 'field.text'], ['email', 'field.text'], ['phone', 'field.text'], ['number', 'field.text'],
    ['password', 'field.text'], ['select', 'field.select'], ['autocomplete', 'field.select'],
    ['textarea', 'field.textarea'], ['date', 'field.date'], ['datetime', 'field.date'], ['file', 'field.file'],
    ['switch', 'field.switch'], ['radio', 'option.radio'], ['multiselect', 'option.checkbox'],
    ['checkbox', 'field.checkbox'], ['custom-rating', 'field.text'],
  ])('maps %s to %s', (type, role) => {
    expect(roleForField(field(type))).toBe(role);
  });

  it('renders a checkbox with options as a group of rows', () => {
    expect(roleForField(field('checkbox', [{ value: 'a', label: 'A' }]))).toBe('option.checkbox');
  });

  it('maps every field type to a role that kits provide', () => {
    const types = ['text', 'email', 'select', 'textarea', 'date', 'file', 'checkbox', 'switch', 'radio', 'multiselect', 'other'];
    for (const type of types) expect(ROLES).toContain(roleForField(field(type)));
  });
});

describe('slotForName', () => {
  it.each([
    ['Label', 'label'], ['Header', 'label'], ['Title', 'label'], ['Value', 'value'], ['Placeholder', 'value'],
    ['Input text', 'value'], ['Helper', 'helper'], ['Helper text', 'helper'], ['Supporting text', 'helper'],
    ['Icon', undefined],
  ])('detects %s as %s', (name, slot) => {
    expect(slotForName(name)).toBe(slot);
  });

  it('uses explicit bindings and ignores heuristics once any slot is bound', () => {
    const binding = { source: 'library' as const, key: 'k', text: { label: 'Caption' } };
    expect(slotForName('Caption', binding)).toBe('label');
    expect(slotForName('Label', binding)).toBeUndefined();
  });
});
