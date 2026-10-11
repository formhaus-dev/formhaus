import { describe, expect, it } from 'vitest';
import { addField, addOptions, createForm, moveOption, removeOption, setFieldType, setOptionValue, setOptionLabel, toDefinition } from '../src';

function choice() {
  const form = createForm();
  const item = addField(form, { step: null }, { type: 'radio', label: 'Size' });
  setOptionLabel(form, item.uid, item.options[0].uid, 'Small');
  setOptionLabel(form, item.uid, item.options[1].uid, 'Large');
  return { form, item };
}

describe('option ops', () => {
  it('starts choice fields with two options', () => {
    const form = createForm();
    const item = addField(form, { step: null }, { label: 'Pick' });
    setFieldType(form, item.uid, 'multiselect');
    expect(item.options.length).toBe(2);
  });

  it('adds pasted lines after an option', () => {
    const { form, item } = choice();
    addOptions(form, item.uid, ['Medium', 'Huge'], item.options[0].uid);
    expect(item.options.map((option) => option.label)).toEqual(['Small', 'Medium', 'Huge', 'Large']);
  });

  it('reorders to a final index', () => {
    const { form, item } = choice();
    addOptions(form, item.uid, ['Medium']);
    moveOption(form, item.uid, item.options[0].uid, 2);
    expect(item.options.map((option) => option.label)).toEqual(['Large', 'Medium', 'Small']);
    moveOption(form, item.uid, item.options[2].uid, 0);
    expect(item.options.map((option) => option.label)).toEqual(['Small', 'Large', 'Medium']);
  });

  it('keeps one option at least', () => {
    const { form, item } = choice();
    expect(removeOption(form, item.uid, item.options[0].uid)).toBe(true);
    expect(removeOption(form, item.uid, item.options[0].uid)).toBe(false);
  });

  it('serializes a manual value and keeps it on relabel', () => {
    const { form, item } = choice();
    setOptionValue(form, item.uid, item.options[0].uid, 's');
    setOptionLabel(form, item.uid, item.options[0].uid, 'Tiny');
    expect(toDefinition(form).fields?.[0].options).toEqual([{ value: 's', label: 'Tiny' }, { value: 'large', label: 'Large' }]);
  });
});
