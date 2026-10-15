import { describe, expect, it } from 'vitest';
import { checkDefinition } from '../../src';
import { FORMAT_VERSION } from '../../src/definition-validation/format';
import { type FixableIssue, suggestFixes } from '../../src/fix';
import { fixesAt, form, repaired, text } from './helpers';

describe('suggestFixes', () => {
  it('returns the checkDefinition issues unchanged when nothing can be fixed', () => {
    const definition = form([text('a', { validation: { pattern: '[' } })]);
    expect(suggestFixes(definition)).toEqual(checkDefinition(definition));
  });

  it('uses the issues it is given', () => {
    const issues: FixableIssue[] = [{ code: 'duplicate-key', severity: 'error', path: '/fields/1/key', message: 'x' }];
    expect(suggestFixes(form([text('a'), text('a')]), issues)[0].fixes?.[0].title).toBe('Rename the key to "a_2"');
  });

  it('adds a form id from the title', () => {
    const { id: _, ...definition } = form([text('a')], { title: 'Contact us!' });
    expect(fixesAt(definition, '', 'missing-property')).toEqual([
      { title: 'Set the id to "contact-us"', safe: true, patch: [{ op: 'add', path: '/id', value: 'contact-us' }] },
    ]);
  });

  it('adds a unique step id from the step title', () => {
    const definition = {
      id: 'f',
      title: 'F',
      submit: { label: 'Go' },
      steps: [
        { id: 'about-you', title: 'About', fields: [text('a')] },
        { title: 'About you', fields: [text('b')] },
      ],
    };
    expect(repaired(definition, '/steps/1', 'missing-property')).toMatchObject({ steps: [{ id: 'about-you' }, { id: 'about-you-2' }] });
  });

  it('adds a unique field key from the label', () => {
    const definition = form([text('yourEmail'), { type: 'email', label: 'Your email' }]);
    expect(fixesAt(definition, '/fields/1', 'missing-property')).toEqual([
      { title: 'Set the key to "yourEmail2"', safe: true, patch: [{ op: 'add', path: '/fields/1/key', value: 'yourEmail2' }] },
    ]);
  });

  it('adds an option value from its label', () => {
    const definition = form([{ key: 'plan', type: 'radio', label: 'Plan', options: [{ value: 'pro', label: 'Pro' }, { label: 'Pro' }] }]);
    expect(repaired(definition, '/fields/0/options/1', 'missing-property')).toMatchObject({
      fields: [{ options: [{ value: 'pro' }, { value: 'pro-2', label: 'Pro' }] }],
    });
  });

  it('adds a submit action', () => {
    const { submit: _, ...definition } = form([text('a')]);
    expect(fixesAt(definition, '', 'missing-property')).toEqual([
      { title: 'Add a submit button labeled "Submit"', safe: true, patch: [{ op: 'add', path: '/submit', value: { label: 'Submit' } }] },
    ]);
  });

  it('renames a later duplicate key with a numeric suffix', () => {
    const definition = form([text('email'), text('email'), text('email'), text('email_2')]);
    expect(fixesAt(definition, '/fields/1/key')).toEqual([
      { title: 'Rename the key to "email_3"', safe: true, patch: [{ op: 'add', path: '/fields/1/key', value: 'email_3' }] },
    ]);
  });

  it.each([
    ['a condition', text('x', { show: [{ field: 'email', notEmpty: true }] })],
    ['matchField', text('x', { validation: { matchField: 'email' } })],
    ['optionsDependsOn', { key: 'x', type: 'select', label: 'X', optionsFrom: 'list', optionsDependsOn: ['email'] }],
  ])('marks a duplicate key rename as unsafe when %s uses the key', (_, other) => {
    expect(fixesAt(form([text('email'), text('email'), other]), '/fields/1/key')[0].safe).toBe(false);
  });

  it('renames a duplicate step id, unsafe when a route targets it', () => {
    const steps = (routes: unknown[]) => ({
      id: 'f',
      title: 'F',
      submit: { label: 'Go' },
      steps: [
        { id: 'a', title: 'A', fields: [text('x')], routes },
        { id: 'b', title: 'B', fields: [text('y')] },
        { id: 'b', title: 'B', fields: [text('z')] },
      ],
    });
    expect(fixesAt(steps([]), '/steps/2/id')).toEqual([
      { title: 'Rename the step id to "b-2"', safe: true, patch: [{ op: 'add', path: '/steps/2/id', value: 'b-2' }] },
    ]);
    expect(fixesAt(steps([{ to: 'b' }]), '/steps/2/id')[0].safe).toBe(false);
  });

  it('points an unknown condition field at the closest key, as an unsafe fix', () => {
    const definition = form([text('email'), text('note', { show: [{ field: 'emial', notEmpty: true }] })]);
    expect(fixesAt(definition, '/fields/1/show/0/field')).toEqual([
      { title: 'Use the field "email"', safe: false, patch: [{ op: 'replace', path: '/fields/1/show/0/field', value: 'email' }] },
    ]);
  });

  it('offers no fix for an unknown field without a close key', () => {
    expect(fixesAt(form([text('email'), text('note', { show: [{ field: 'zzz', notEmpty: true }] })]), '/fields/1/show/0/field')).toEqual(
      [],
    );
  });

  it('renames a misspelled operator, field type and route target as unsafe fixes', () => {
    expect(fixesAt(form([text('a'), text('b', { show: [{ field: 'a', notEmty: true }] })]), '/fields/1/show/0/notEmty')).toEqual([
      {
        title: 'Rename "notEmty" to "notEmpty"',
        safe: false,
        patch: [{ op: 'move', from: '/fields/1/show/0/notEmty', path: '/fields/1/show/0/notEmpty' }],
      },
    ]);
    expect(fixesAt(form([{ key: 'a', type: 'emial', label: 'A' }]), '/fields/0/type')[0]).toMatchObject({
      title: 'Use the type "email"',
      safe: false,
    });
    const routed = {
      id: 'f',
      title: 'F',
      submit: { label: 'Go' },
      steps: [
        { id: 'start', title: 'S', fields: [text('a')], routes: [{ to: 'reveiw' }] },
        { id: 'review', title: 'R', fields: [text('b')] },
      ],
    };
    expect(fixesAt(routed, '/steps/0/routes/0/to')[0]).toMatchObject({ title: 'Use the step "review"', safe: false });
  });

  it('swaps an inverted range as an unsafe fix', () => {
    const definition = form([text('a', { validation: { minLength: 9, maxLength: 3 } })]);
    expect(repaired(definition, '/fields/0/validation/minLength')).toMatchObject({
      fields: [{ validation: { minLength: 3, maxLength: 9 } }],
    });
    expect(fixesAt(definition, '/fields/0/validation/minLength')[0].safe).toBe(false);
  });

  it('sets formatVersion, safe only when the major version matches', () => {
    expect(fixesAt(form([text('a')], { formatVersion: 1 }), '/formatVersion')).toEqual([
      {
        title: `Set formatVersion to "${FORMAT_VERSION}"`,
        safe: true,
        patch: [{ op: 'replace', path: '/formatVersion', value: FORMAT_VERSION }],
      },
    ]);
    expect(fixesAt(form([text('a')], { formatVersion: 'v1' }), '/formatVersion')[0].safe).toBe(true);
    expect(fixesAt(form([text('a')], { formatVersion: '0.9' }), '/formatVersion')[0].safe).toBe(false);
    expect(fixesAt(form([text('a')], { formatVersion: '2.0' }), '/formatVersion')[0].safe).toBe(false);
  });

  it.each([
    ['an invalid pattern', form([text('a', { validation: { pattern: '(' } })]), '/fields/0/validation/pattern'],
    [
      'a condition cycle',
      form([text('a', { show: [{ field: 'b', notEmpty: true }] }), text('b', { show: [{ field: 'a', notEmpty: true }] })]),
      '/fields/0',
    ],
  ])('offers no fix for %s', (_, definition, path) => {
    expect(suggestFixes(definition).find((issue) => issue.path === path)).toBeDefined();
    expect(fixesAt(definition, path)).toEqual([]);
  });

  it('returns the issues of a definition that is not an object', () => {
    expect(suggestFixes('nope')).toEqual(checkDefinition('nope'));
  });
});
