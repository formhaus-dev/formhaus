import { describe, expect, it } from 'vitest';
import { childrenOf, duplicateField, fromDefinition, isQuestion, referencesTo, removeStep, setOptionValue, toDefinition } from '../src';

import { order, household, signup, errors, inner } from './scope.fixtures';

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

describe('reference upkeep', () => {
  it('moves conditions along with a custom option value', () => {
    const form = fromDefinition(order);
    const kind = inner(form, 'billing', 'kind');
    const detail = inner(form, 'billing', 'detail');
    detail.extra.show = [{ field: 'kind', in: ['company', 'person'] }];
    setOptionValue(form, kind.uid, kind.options[0].uid, 'firm');
    expect(detail.extra.show).toEqual([{ field: 'kind', in: ['firm', 'person'] }]);
  });

  it('keeps the routes that do not target a deleted step', () => {
    const form = fromDefinition({
      ...signup,
      steps: [
        {
          ...signup.steps![0],
          routes: [
            { to: 'two', show: [{ field: 'email', notEmpty: true }] },
            { to: 'three', show: [{ field: 'email', eq: 'a@b.co' }] },
            { to: null },
          ],
        },
        signup.steps![1],
        { id: 'three', fields: [{ key: 'last', type: 'text', label: 'Last' }] },
      ],
    });
    expect(removeStep(form, form.blocks.find((block) => block.kind === 'page' && block.id === 'two')!.uid, 'with-fields')).toBe(true);
    expect(toDefinition(form).steps![0].routes).toEqual([{ to: 'three', show: [{ field: 'email', eq: 'a@b.co' }] }, { to: null }]);
  });

  it('counts matchField and optionsDependsOn as references', () => {
    const form = fromDefinition(signup);
    expect(referencesTo(form, form.blocks[1].uid)).toEqual([form.blocks[0].uid, form.blocks[2].uid, form.blocks[3].uid]);
  });
});
