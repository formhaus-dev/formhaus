import { describe, expect, it } from 'vitest';
import { addField, createForm, fromDefinition, setFieldProp, setFieldType, setMultiple, toDefinition } from '../src';

function upload() {
  const form = createForm();
  const item = addField(form, { step: null }, { type: 'file', label: 'Receipts' });
  return { form, item };
}

describe('file list ops', () => {
  it('turns a file field into a file list and raises the format to 1.7', () => {
    const { form, item } = upload();
    setMultiple(form, item.uid, true);
    setFieldProp(form, item.uid, 'validation', { maxLength: 5 });
    expect(toDefinition(form)).toMatchObject({
      formatVersion: '1.7',
      fields: [{ key: 'receipts', type: 'file', multiple: true, validation: { maxLength: 5 } }],
    });
  });

  it('drops the file count when the list turns off or the type changes', () => {
    const { form, item } = upload();
    setMultiple(form, item.uid, true);
    setFieldProp(form, item.uid, 'validation', { maxLength: 5, maxLengthMessage: 'Five at most', pattern: 'x' });
    setMultiple(form, item.uid, false);
    expect(toDefinition(form).fields?.[0]).toEqual({ key: 'receipts', type: 'file', label: 'Receipts', validation: { pattern: 'x' } });
    setMultiple(form, item.uid, true);
    setFieldProp(form, item.uid, 'validation', { maxLength: 5 });
    setFieldType(form, item.uid, 'text');
    expect(toDefinition(form).fields?.[0]).toEqual({ key: 'receipts', type: 'text', label: 'Receipts' });
  });

  it('ignores multiple on other types', () => {
    const form = createForm();
    const item = addField(form, { step: null }, { type: 'text', label: 'Name' });
    setMultiple(form, item.uid, true);
    expect(toDefinition(form).fields?.[0]).not.toHaveProperty('multiple');
  });

  it('keeps multiple through a round trip', () => {
    const definition = {
      formatVersion: '1.7',
      id: 'expenses',
      title: 'Expenses',
      submit: { label: 'Send' },
      fields: [{ key: 'receipts', type: 'file', label: 'Receipts', multiple: true, validation: { maxLength: 5 } }],
    };
    expect(toDefinition(fromDefinition(definition))).toEqual(definition);
  });
});
