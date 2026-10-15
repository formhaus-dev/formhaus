import { describe, expect, it } from 'vitest';
import {
  conditionSources,
  findIssues,
  fromDefinition,
  moveFieldTo,
  referencesTo,
  removeField,
  setKey,
  setLabel,
  setOptionLabel,
  toDefinition,
} from '../src';

import { order, signup, errors, inner } from './scope.fixtures';

describe('group scope', () => {
  it('renames a key only inside its own group', () => {
    const form = fromDefinition(order);
    setLabel(form, inner(form, 'billing', 'kind').uid, 'Category');
    const [billing, shipping] = toDefinition(form).fields as { fields: FormNode[] }[];
    expect(billing.fields.map((field) => field.key)).toEqual(['category', 'detail']);
    expect(billing.fields[1].show).toEqual([{ field: 'category', eq: 'company' }]);
    expect(shipping.fields.map((field) => field.key)).toEqual(['kind', 'detail']);
    expect(shipping.fields[1].show).toEqual([{ field: 'kind', eq: 'company' }]);
    expect(errors(form)).toEqual([]);
  });

  it('renames option values only for the field that owns them', () => {
    const form = fromDefinition(order);
    const kind = inner(form, 'billing', 'kind');
    setOptionLabel(form, kind.uid, kind.options[0].uid, 'Business');
    expect(inner(form, 'billing', 'detail').extra.show).toEqual([{ field: 'kind', eq: 'business' }]);
    expect(inner(form, 'shipping', 'detail').extra.show).toEqual([{ field: 'kind', eq: 'company' }]);
  });

  it('drops conditions only on the deleted field of the same group', () => {
    const form = fromDefinition({ ...order, lang: 'en' });
    expect(removeField(form, inner(form, 'billing', 'kind').uid)).toBe(true);
    expect(inner(form, 'billing', 'detail').extra.show).toBeUndefined();
    expect(inner(form, 'shipping', 'detail').extra.show).toEqual([{ field: 'kind', eq: 'company' }]);
    expect(errors(form)).toEqual([]);
  });

  it('resolves sources, references and issues per group', () => {
    const form = fromDefinition(order);
    const detail = inner(form, 'shipping', 'detail');
    expect(conditionSources(form, detail.uid).map((item) => item.uid)).toEqual([
      form.blocks[0].uid,
      form.blocks[3].uid,
      inner(form, 'shipping', 'kind').uid,
    ]);
    expect(referencesTo(form, inner(form, 'billing', 'kind').uid)).toEqual([inner(form, 'billing', 'detail').uid]);
    expect(findIssues(form).filter((issue) => issue.severity === 'error')).toEqual([]);
    form.blocks[0].key = 'kind';
    form.blocks[0].keyLocked = true;
    expect(findIssues(form).map((issue) => issue.message)).toContain('Response key "kind" is used by another field.');
  });

  it('moves a field out of its group without conditions on former siblings', () => {
    const form = fromDefinition({
      ...order,
      fields: undefined,
      steps: [
        { id: 'one', fields: order.fields! },
        { id: 'two', fields: [] },
      ],
    });
    const detail = inner(form, 'shipping', 'detail');
    expect(moveFieldTo(form, detail.uid, form.blocks.at(-1)!.uid, 0)).toBe(true);
    expect(detail.parent).toBeUndefined();
    expect(detail.extra.show).toBeUndefined();
    expect(inner(form, 'billing', 'detail').extra.show).toEqual([{ field: 'kind', eq: 'company' }]);
    expect(errors(form)).toEqual([]);
  });
});

describe('custom keys', () => {
  it('moves references to a new key only inside the same group', () => {
    const form = fromDefinition(order);
    setKey(form, inner(form, 'billing', 'kind').uid, 'category');
    expect(inner(form, 'billing', 'detail').extra.show).toEqual([{ field: 'category', eq: 'company' }]);
    expect(inner(form, 'shipping', 'kind').key).toBe('kind');
    expect(inner(form, 'shipping', 'detail').extra.show).toEqual([{ field: 'kind', eq: 'company' }]);
    expect(errors(form)).toEqual([]);
  });

  it('moves conditions, matchField, optionsDependsOn and routes to a new key', () => {
    const form = fromDefinition(signup);
    setKey(form, form.blocks[1].uid, 'mail');
    const [one] = toDefinition(form).steps!;
    expect(one.fields[1]).toMatchObject({ validation: { matchField: 'mail' }, show: [{ field: 'mail', notEmpty: true }] });
    expect(one.fields[2]).toMatchObject({ optionsDependsOn: ['mail'] });
    expect(one.routes).toEqual([{ to: null, show: [{ field: 'mail', notEmpty: true }] }, { to: 'two' }]);
  });
});
