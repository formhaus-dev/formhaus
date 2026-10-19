import { fromDefinition, isQuestion, logicOf, scopeOf } from '@formhaus/builder';
import type { FormNode } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { describeLogic } from './describe';

const party = (key: string, label: string): FormNode => ({
  key,
  type: 'group',
  label: key,
  fields: [
    { key: 'kind', type: 'radio', label: 'Kind', options: [{ value: 'company', label }] },
    { key: 'detail', type: 'text', label: 'Detail', show: [{ field: 'kind', eq: 'company' }] },
  ],
});

describe('describeLogic', () => {
  it('names the source field of the same group', () => {
    const form = fromDefinition({
      id: 'order',
      title: 'Order',
      submit: { label: 'Send' },
      fields: [party('billing', 'Company'), party('shipping', 'Firm')],
    });
    const [, second] = form.blocks.filter((block) => isQuestion(block) && block.key === 'detail');
    expect(describeLogic(form, logicOf(form, second!), scopeOf(form, second))).toBe('Shown if Kind is Firm');
  });

  it('describes a contains condition with the option label', () => {
    const form = fromDefinition({
      id: 'signup',
      title: 'Sign up',
      submit: { label: 'Send' },
      fields: [
        { key: 'interests', type: 'multiselect', label: 'Interests', options: [{ value: 'other', label: 'Other' }] },
        { key: 'other', type: 'text', label: 'Other interest', show: [{ field: 'interests', contains: 'other' }] },
      ],
    });
    const other = form.blocks.find((block) => isQuestion(block) && block.key === 'other')!;
    expect(describeLogic(form, logicOf(form, other))).toBe('Shown if Interests includes Other');
  });
});
