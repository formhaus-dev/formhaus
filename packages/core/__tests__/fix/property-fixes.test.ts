import { describe, expect, it } from 'vitest';
import { applyFix, fixAll } from '../../src/fix';
import { type Definition, fixesAt, form, repaired, text } from './helpers';

describe('fixes for property checks', () => {
  it('renames a misspelled property to the name it was meant to be', () => {
    const definition = { imd: 'contact', title: 'Contact', submit: { label: 'Send' }, fields: [text('a')] };
    const rename = { title: 'Rename "imd" to "id"', safe: true, patch: [{ op: 'move', from: '/imd', path: '/id' }] };
    expect(fixesAt(definition, '/imd', 'unknown-property')).toEqual([rename]);
    expect(fixesAt(definition, '', 'missing-property')).toEqual([rename]);
    expect(Object.keys(applyFix(definition, rename.patch as never))).toEqual(['id', 'title', 'submit', 'fields']);
  });

  it('renames misspelled field, option and validation properties', () => {
    const definition = form([
      { key: 'plan', type: 'radio', lable: 'Plan', options: [{ value: 'a', labl: 'A' }], validation: { requird: true } },
    ]);
    expect(fixesAt(definition, '/fields/0/lable', 'unknown-property')[0].patch).toEqual([
      { op: 'move', from: '/fields/0/lable', path: '/fields/0/label' },
    ]);
    expect(fixesAt(definition, '/fields/0/options/0/labl', 'unknown-property')[0].safe).toBe(true);
    expect(fixesAt(definition, '/fields/0/validation/requird', 'unknown-property')[0].title).toBe('Rename "requird" to "required"');
  });

  it('moves a rule set on the field into validation as an unsafe fix', () => {
    const definition = form([text('a', { required: true }), text('b', { maxLength: 5, validation: { minLength: 1 } })]);
    const first = fixesAt(definition, '/fields/0/required', 'unknown-property');
    expect(first).toEqual([
      {
        title: 'Move "required" into "validation"',
        safe: false,
        patch: [
          { op: 'add', path: '/fields/0/validation', value: {} },
          { op: 'move', from: '/fields/0/required', path: '/fields/0/validation/required' },
        ],
      },
    ]);
    expect(applyFix(definition, first[0].patch).fields).toMatchObject([{ validation: { required: true } }, {}]);
    expect(repaired(definition, '/fields/1/maxLength', 'unknown-property').fields).toEqual([
      text('a', { required: true }),
      text('b', { validation: { minLength: 1, maxLength: 5 } }),
    ]);
  });

  it('offers no fix for an unknown property without a close name', () => {
    expect(fixesAt(form([text('a')], { colour: 'red' }), '/colour', 'unknown-property')).toEqual([]);
  });

  it('fills an empty or missing field label from the key', () => {
    expect(fixesAt(form([text('firstName', { label: ' ' })]), '/fields/0/label', 'missing-label')).toEqual([
      { title: 'Set the label to "First name"', safe: true, patch: [{ op: 'add', path: '/fields/0/label', value: 'First name' }] },
    ]);
    expect(repaired(form([{ key: 'work_email', type: 'email' }]), '/fields/0/label', 'missing-label')).toMatchObject({
      fields: [{ label: 'Work email' }],
    });
    expect(
      repaired(form([{ key: 'p', type: 'radio', label: 'P', options: [{ value: 'yes' }] }]), '/fields/0/options/0/label', 'missing-label'),
    ).toMatchObject({ fields: [{ options: [{ value: 'yes', label: 'Yes' }] }] });
  });

  it('fills a missing action label with the default text', () => {
    expect(fixesAt(form([text('a')], { submit: {} }), '/submit/label', 'missing-label')).toEqual([
      { title: 'Set the label to "Submit"', safe: true, patch: [{ op: 'add', path: '/submit/label', value: 'Submit' }] },
    ]);
    const steps = (extra: Definition) => ({
      id: 'f',
      title: 'F',
      submit: { label: 'Go' },
      ...extra,
      steps: [
        { id: 's', title: 'S', next: {}, fields: [text('a')] },
        { id: 't', title: 'T', fields: [text('b')] },
      ],
    });
    expect(fixesAt(steps({}), '/steps/0/next/label', 'missing-label')[0]).toMatchObject({
      title: 'Set the label to "Continue"',
      safe: true,
    });
    expect(fixesAt(steps({ labels: { continue: 'Weiter' } }), '/steps/0/next/label', 'missing-label')[0].safe).toBe(false);
  });

  it('adds an empty fields list to a step', () => {
    const definition = { id: 'f', title: 'F', submit: { label: 'Go' }, steps: [{ id: 's', title: 'S' }] };
    expect(repaired(definition, '/steps/0', 'missing-property')).toEqual({ ...definition, steps: [{ id: 's', title: 'S', fields: [] }] });
  });

  it('repairs the founder case in one pass', () => {
    const definition = {
      imd: 'contact',
      title: 'Contact us',
      submit: { label: 'Send' },
      fields: [text('name'), { key: 'email', type: 'email', label: '' }, { key: 'email', type: 'email', label: 'Work email' }],
    };
    const result = fixAll(definition);
    expect(result.definition).toEqual({
      id: 'contact',
      title: 'Contact us',
      submit: { label: 'Send' },
      fields: [text('name'), { key: 'email', type: 'email', label: 'Email' }, { key: 'email_2', type: 'email', label: 'Work email' }],
    });
    expect(result.issues).toEqual([]);
    expect(result.applied.map(({ title }) => title)).toEqual([
      'Rename "imd" to "id"',
      'Rename the key to "email_2"',
      'Set the label to "Email"',
    ]);
  });
});

describe('fixes for repeated option values', () => {
  const plan = (
    extra: Definition = {},
    options = [
      { value: 'pro', label: 'Pro' },
      { value: 'pro', label: 'Team' },
    ],
  ) => ({ key: 'plan', type: 'select', label: 'Plan', options, ...extra });

  it('suffixes the later value, safe when nothing uses it', () => {
    expect(fixesAt(form([plan()]), '/fields/0/options/1/value')).toEqual([
      { title: 'Change the value to "pro_2"', safe: true, patch: [{ op: 'add', path: '/fields/0/options/1/value', value: 'pro_2' }] },
    ]);
    const taken = plan({}, [
      { value: 'pro', label: 'A' },
      { value: 'pro', label: 'B' },
      { value: 'pro_2', label: 'C' },
    ]);
    expect(fixesAt(form([taken]), '/fields/0/options/1/value')[0].title).toBe('Change the value to "pro_3"');
  });

  it.each([
    ['an eq condition', [plan(), text('x', { show: [{ field: 'plan', eq: 'pro' }] })]],
    ['an in condition', [plan(), text('x', { showAny: [{ field: 'plan', in: ['free', 'pro'] }] })]],
    ['a contains condition', [plan({ type: 'multiselect' }), text('x', { show: [{ field: 'plan', contains: 'pro' }] })]],
    ['the default value', [plan({ defaultValue: 'pro' })]],
  ])('marks the fix unsafe when %s uses the value', (_, fields) => {
    expect(fixesAt(form(fields), '/fields/0/options/1/value')[0].safe).toBe(false);
  });

  it('keeps the fix safe when a condition tests another value', () => {
    expect(fixesAt(form([plan(), text('x', { show: [{ field: 'plan', eq: 'free' }] })]), '/fields/0/options/1/value')[0].safe).toBe(true);
  });
});

describe('fixAll', () => {
  it('applies every safe fix and keeps the unsafe ones', () => {
    const definition = {
      title: 'Contact',
      fields: [
        text('email'),
        text('email'),
        { type: 'text', label: 'Phone number' },
        text('note', { show: [{ field: 'emaly', notEmpty: true }] }),
      ],
    };
    const result = fixAll(definition);
    expect(result.definition).toEqual({
      id: 'contact',
      title: 'Contact',
      fields: [
        text('email'),
        { ...text('email'), key: 'email_2' },
        { key: 'phoneNumber', type: 'text', label: 'Phone number' },
        text('note', { show: [{ field: 'emaly', notEmpty: true }] }),
      ],
      submit: { label: 'Submit' },
    });
    expect(result.applied.map(({ code, path, title }) => `${code} ${path} ${title}`)).toEqual([
      'missing-property /fields/2 Set the key to "phoneNumber"',
      'missing-property  Set the id to "contact"',
      'missing-property  Add a submit button labeled "Submit"',
      'duplicate-key /fields/1/key Rename the key to "email_2"',
    ]);
    expect(result.issues.map(({ code, fixes }) => `${code} ${fixes?.map((fix) => fix.safe).join(',')}`)).toEqual(['unknown-field false']);
    expect(definition.fields[1].key).toBe('email');
  });

  it('returns the definition as is when nothing is safe to fix', () => {
    const definition = form([text('a', { validation: { pattern: '(' } })]);
    const result = fixAll(definition);
    expect(result.definition).toBe(definition);
    expect(result.applied).toEqual([]);
  });
});
