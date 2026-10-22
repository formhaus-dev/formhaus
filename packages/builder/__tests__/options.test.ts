import { describe, expect, it } from 'vitest';
import {
  addField,
  addOptions,
  childrenOf,
  createForm,
  moveOption,
  removeOption,
  setFieldType,
  setMatrix,
  setOptionPinned,
  setOptionValue,
  setOptionLabel,
  setRandomize,
  toDefinition,
} from '../src';

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
    expect(toDefinition(form).fields?.[0].options).toEqual([
      { value: 's', label: 'Tiny' },
      { value: 'large', label: 'Large' },
    ]);
  });

  it('randomizes options and pins one in place', () => {
    const { form, item } = choice();
    setRandomize(form, item.uid, true);
    setOptionPinned(form, item.uid, item.options[1].uid, true);
    expect(toDefinition(form).fields?.[0]).toMatchObject({
      randomize: true,
      options: [
        { value: 'small', label: 'Small' },
        { value: 'large', label: 'Large', pinned: true },
      ],
    });
    setOptionPinned(form, item.uid, item.options[1].uid, false);
    expect(item.options[1].extra).toBeUndefined();
  });

  it('raises an older formatVersion to 1.6', () => {
    for (const [from, to] of [
      [undefined, '1.6'],
      ['1.3', '1.6'],
      ['1.7', '1.7'],
      ['2.0', '2.0'],
    ]) {
      const { form, item } = choice();
      if (from) form.extra.formatVersion = from;
      setOptionPinned(form, item.uid, item.options[0].uid, true);
      expect(form.extra.formatVersion).toBe(to);
      delete form.extra.formatVersion;
      setRandomize(form, item.uid, true);
      expect(toDefinition(form).formatVersion).toBe('1.6');
    }
  });

  it('drops pins when randomize turns off', () => {
    const { form, item } = choice();
    setRandomize(form, item.uid, true);
    setOptionPinned(form, item.uid, item.options[0].uid, true);
    setRandomize(form, item.uid, false);
    const [field] = toDefinition(form).fields ?? [];
    expect(field).not.toHaveProperty('randomize');
    expect(field?.options?.[0]).toEqual({ value: 'small', label: 'Small' });
  });

  it('drops the order for types without options', () => {
    const { form, item } = choice();
    setRandomize(form, item.uid, true);
    setOptionPinned(form, item.uid, item.options[0].uid, true);
    setFieldType(form, item.uid, 'select');
    expect(item.extra.randomize).toBe(true);
    setFieldType(form, item.uid, 'text');
    expect(item.extra).not.toHaveProperty('randomize');
    expect(item.options[0].extra).toBeUndefined();
  });

  it('drops the order of matrix rows', () => {
    const form = createForm();
    const section = addField(form, { step: null }, { type: 'section', label: 'Rate' });
    const [row] = childrenOf(form, section.uid);
    setFieldType(form, row.uid, 'radio');
    setRandomize(form, row.uid, true);
    setOptionPinned(form, row.uid, row.options[0].uid, true);
    setMatrix(form, section.uid, true);
    expect(row.extra).not.toHaveProperty('randomize');
    expect(row.options.every((option) => option.extra?.pinned === undefined)).toBe(true);
  });
});
