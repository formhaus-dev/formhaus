import { checkDefinition, type FormDefinition, type FormNode } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import {
  childrenOf,
  conditionSources,
  duplicateField,
  findIssues,
  fromDefinition,
  isQuestion,
  moveFieldTo,
  referencesTo,
  removeField,
  setLabel,
  setOptionLabel,
  toDefinition,
  type BuilderForm,
} from '../src';

const party = (key: string, label: string): FormNode => ({
  key,
  type: 'group',
  label,
  fields: [
    {
      key: 'kind',
      type: 'radio',
      label: 'Kind',
      options: [
        { value: 'company', label: 'Company' },
        { value: 'person', label: 'Person' },
      ],
    },
    { key: 'detail', type: 'text', label: 'Detail', show: [{ field: 'kind', eq: 'company' }] },
  ],
});

const order: FormDefinition = {
  formatVersion: '1.1',
  id: 'order',
  title: 'Order',
  submit: { label: 'Send' },
  fields: [party('billing', 'Billing'), party('shipping', 'Shipping')],
};

const household: FormDefinition = {
  formatVersion: '1.1',
  id: 'household',
  title: 'Household',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'home',
      type: 'section',
      title: 'Home',
      fields: [
        {
          key: 'ownership',
          type: 'radio',
          label: 'Owner',
          options: [
            { value: 'own', label: 'Own' },
            { value: 'rent', label: 'Rent' },
          ],
        },
        { key: 'landlord', type: 'text', label: 'Landlord', show: [{ field: 'ownership', eq: 'rent' }] },
        {
          key: 'people',
          type: 'group',
          label: 'People',
          fields: [
            { key: 'fullName', type: 'text', label: 'Name' },
            { key: 'nick', type: 'text', label: 'Nickname', show: [{ field: 'fullName', notEmpty: true }] },
          ],
        },
      ],
    },
  ],
};

const errors = (form: BuilderForm) => checkDefinition(toDefinition(form)).filter((issue) => issue.severity === 'error');
const inner = (form: BuilderForm, group: string, key: string) =>
  childrenOf(form, form.blocks.find((block) => isQuestion(block) && block.key === group)!.uid).find((child) => child.key === key)!;

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

describe('duplicating containers', () => {
  it('copies a section with its nested group and remaps references to the copy', () => {
    const form = fromDefinition(household);
    const copy = duplicateField(form, form.blocks[0].uid)!;
    const fields = toDefinition(form).fields!;
    expect(fields[0]).toEqual(household.fields![0]);
    expect(fields[1]).toEqual({
      key: 'home2',
      type: 'section',
      title: 'Home',
      fields: [
        {
          key: 'owner',
          type: 'radio',
          label: 'Owner',
          options: [
            { value: 'own', label: 'Own' },
            { value: 'rent', label: 'Rent' },
          ],
        },
        { key: 'landlord2', type: 'text', label: 'Landlord', show: [{ field: 'owner', eq: 'rent' }] },
        {
          key: 'people2',
          type: 'group',
          label: 'People',
          fields: [
            { key: 'name', type: 'text', label: 'Name' },
            { key: 'nickname', type: 'text', label: 'Nickname', show: [{ field: 'name', notEmpty: true }] },
          ],
        },
      ],
    });
    const uids = form.blocks.map((block) => block.uid);
    expect(new Set(uids).size).toBe(uids.length);
    expect(childrenOf(form, copy.uid).map((child) => child.key)).toEqual(['owner', 'landlord2', 'people2']);
    expect(errors(form)).toEqual([]);
  });

  it('copies a group with references to its own copied fields', () => {
    const form = fromDefinition(household);
    const people = form.blocks.find((block) => isQuestion(block) && block.key === 'people')!;
    const copy = duplicateField(form, people.uid)!;
    expect(childrenOf(form, copy.uid).map((child) => [child.key, child.extra.show])).toEqual([
      ['name', undefined],
      ['nickname', [{ field: 'name', notEmpty: true }]],
    ]);
    expect(inner(form, 'people', 'nick').extra.show).toEqual([{ field: 'fullName', notEmpty: true }]);
    expect(errors(form)).toEqual([]);
  });
});
