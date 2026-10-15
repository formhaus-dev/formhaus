import { describe, expect, it } from 'vitest';
import { fixAll } from '../../src/fix';
import { typoDistance } from '../../src/fix/references';
import { type Definition, fixesAt, form, text } from './helpers';

const note = (field: string) => text('note', { show: [{ field, notEmpty: true }] });
const steps = (...list: Definition[]) => ({ id: 'f', title: 'F', submit: { label: 'Go' }, steps: list });
const step = (id: string, fields: unknown[], extra: Definition = {}) => ({ id, title: id, fields, ...extra });

describe('typoDistance', () => {
  it.each([
    ['emial', 'email', 1],
    ['Email', 'email', 0],
    ['emil', 'email', 1],
    ['emaly', 'email', 2],
    ['emial', 'emails', 2],
  ])('%s to %s is %i', (a, b, distance) => {
    expect(typoDistance(a, b)).toBe(distance);
  });
});

describe('fixes for unknown references', () => {
  it('marks an unambiguous typo of a condition field as safe', () => {
    expect(fixesAt(form([text('email'), note('emial')]), '/fields/1/show/0/field')).toEqual([
      { title: 'Use the field "email"', safe: true, patch: [{ op: 'replace', path: '/fields/1/show/0/field', value: 'email' }] },
    ]);
  });

  it('counts a repeated key once', () => {
    expect(fixesAt(form([text('email'), text('email'), note('emial')]), '/fields/2/show/0/field')[0]).toMatchObject({ safe: true });
  });

  it('keeps the fix unsafe when another key is within two edits', () => {
    const [fix] = fixesAt(form([text('email'), text('emails'), note('emial')]), '/fields/2/show/0/field');
    expect(fix).toMatchObject({ safe: false });
  });

  it('keeps the fix unsafe when the closest key is two edits away', () => {
    expect(fixesAt(form([text('email'), note('emaly')]), '/fields/1/show/0/field')).toEqual([
      { title: 'Use the field "email"', safe: false, patch: [{ op: 'replace', path: '/fields/1/show/0/field', value: 'email' }] },
    ]);
  });

  it('never points a condition at a field it may not reference', () => {
    const later = steps(step('a', [text('name'), note('emial')]), step('b', [text('email')]));
    expect(fixesAt(later, '/steps/0/fields/1/show/0/field')).toEqual([]);
    const own = steps(step('a', [text('email')]), step('b', [text('other')], { show: [{ field: 'emial', notEmpty: true }] }));
    expect(fixesAt(own, '/steps/1/show/0/field')[0]).toMatchObject({ safe: true });
    const same = steps(step('a', [text('x')]), step('b', [text('email')], { show: [{ field: 'emial', notEmpty: true }] }));
    expect(fixesAt(same, '/steps/1/show/0/field')).toEqual([]);
  });

  it('applies the same rule to matchField and route targets', () => {
    const match = form([text('password'), text('confirm', { validation: { matchField: 'pasword' } })]);
    expect(fixesAt(match, '/fields/1/validation/matchField')[0]).toMatchObject({ title: 'Use the field "password"', safe: true });
    const routed = steps(step('start', [text('a')], { routes: [{ to: 'reveiw' }] }), step('review', [text('b')]));
    expect(fixesAt(routed, '/steps/0/routes/0/to')[0]).toMatchObject({ title: 'Use the step "review"', safe: true });
    const backwards = steps(step('review', [text('a')]), step('start', [text('b')], { routes: [{ to: 'reveiw' }] }));
    expect(fixesAt(backwards, '/steps/1/routes/0/to')).toEqual([]);
  });

  it('looks into sections and keeps group items manual', () => {
    const section = { key: 'billing', type: 'section', title: 'Billing', fields: [text('street'), note('stret')] };
    expect(fixesAt(form([section], { formatVersion: '1.1' }), '/fields/0/fields/1/show/0/field')[0]).toMatchObject({ safe: true });
    const group = { key: 'people', type: 'group', label: 'People', fields: [text('plan'), note('plna')] };
    const [fix] = fixesAt(form([group], { formatVersion: '1.1' }), '/fields/0/fields/1/show/0/field');
    expect(fix).toMatchObject({ title: 'Use the field "plan"', safe: false });
  });

  it('lets fixAll repair an unambiguous typo', () => {
    expect(fixAll(form([text('email'), note('emial')])).definition).toEqual(form([text('email'), note('email')]));
  });
});
