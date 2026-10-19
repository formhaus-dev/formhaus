import { describe, expect, it } from 'vitest';
import { addField, createForm, fromDefinition, setLabel, setRule, toDefinition } from '../src';

describe('validation rules', () => {
  it('sets and clears one rule without touching the others', () => {
    const form = createForm();
    const age = addField(form, { step: null }, { type: 'number', label: 'Age' });
    setRule(form, age.uid, 'min', 18);
    setRule(form, age.uid, 'max', 99);
    setRule(form, age.uid, 'maxMessage', 'Too old');
    expect(age.extra.validation).toEqual({ min: 18, max: 99, maxMessage: 'Too old' });
    setRule(form, age.uid, 'max', undefined);
    setRule(form, age.uid, 'maxMessage', '');
    expect(age.extra.validation).toEqual({ min: 18 });
    setRule(form, age.uid, 'min', undefined);
    expect(age.extra).not.toHaveProperty('validation');
  });

  it('round-trips with the definition and keeps rules the editor does not show', () => {
    const form = fromDefinition({
      id: 'f',
      title: 'F',
      submit: 'Send',
      fields: [
        {
          key: 'name',
          type: 'text',
          label: 'Name',
          validation: { required: true, minLength: 2, validator: 'unique', i18n: { required: { de: 'Pflicht' } } },
        },
      ],
    });
    const name = form.blocks[0]!;
    setRule(form, name.uid, 'maxLength', 40);
    setLabel(form, name.uid, 'Full name');
    expect(toDefinition(form).fields?.[0]).toMatchObject({
      key: 'fullName',
      label: 'Full name',
      validation: { required: true, minLength: 2, validator: 'unique', i18n: { required: { de: 'Pflicht' } }, maxLength: 40 },
    });
    expect(toDefinition(fromDefinition(toDefinition(form)))).toEqual(toDefinition(form));
  });
});
