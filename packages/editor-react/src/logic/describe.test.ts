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
    expect(describeLogic(form, logicOf(form, second!), scopeOf(form, second))).toBe('Shown when Kind is Firm');
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
    expect(describeLogic(form, logicOf(form, other))).toBe('Shown when Interests includes Other');
  });

  describe('repeated sources', () => {
    const size: FormNode = {
      key: 'size',
      type: 'radio',
      label: 'Company size',
      options: [
        { value: 'small', label: '1-10' },
        { value: 'mid', label: '11-50' },
        { value: 'large', label: '51+' },
      ],
    };
    const role: FormNode = { key: 'role', type: 'text', label: 'Role' };
    const summary = (conditions: Record<string, unknown>) => {
      const form = fromDefinition({
        id: 'survey',
        title: 'Survey',
        submit: { label: 'Send' },
        fields: [size, role, { key: 'source', type: 'text', label: 'Source', ...conditions } as FormNode],
      });
      const source = form.blocks.find((block) => isQuestion(block) && block.key === 'source')!;
      return describeLogic(form, logicOf(form, source));
    };

    it('names the field once for consecutive values joined by or', () => {
      expect(
        summary({
          showAny: [
            { field: 'size', eq: 'small' },
            { field: 'size', eq: 'large' },
          ],
        }),
      ).toBe('Shown when Company size is 1-10 or 51+');
    });

    it('names the field once for consecutive any-of lists', () => {
      expect(
        summary({
          showAny: [
            { field: 'size', in: ['small'] },
            { field: 'size', in: ['large'] },
          ],
        }),
      ).toBe('Shown when Company size is any of 1-10 or 51+');
    });

    it('keeps the field name for negated values joined by or', () => {
      expect(
        summary({
          showAny: [
            { field: 'size', neq: 'small' },
            { field: 'size', neq: 'large' },
          ],
        }),
      ).toBe('Shown when Company size is not 1-10 or Company size is not 51+');
    });

    it('keeps the field name for negated values joined by and', () => {
      expect(
        summary({
          show: [
            { field: 'size', notIn: ['small'] },
            { field: 'size', notIn: ['large'] },
          ],
        }),
      ).toBe('Shown when Company size is none of 1-10 and Company size is none of 51+');
    });

    it('keeps the field name when the operator changes', () => {
      expect(
        summary({
          showAny: [
            { field: 'size', eq: 'small' },
            { field: 'size', neq: 'large' },
          ],
        }),
      ).toBe('Shown when Company size is 1-10 or Company size is not 51+');
    });

    it('keeps the field name when another field comes between', () => {
      expect(
        summary({
          showAny: [
            { field: 'size', eq: 'small' },
            { field: 'role', eq: 'Owner' },
            { field: 'size', eq: 'large' },
          ],
        }),
      ).toBe('Shown when Company size is 1-10 or Role is Owner or Company size is 51+');
    });
  });
});
