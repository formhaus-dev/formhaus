import { describe, expect, it } from 'vitest';
import { fixDefinitionTool, validateDefinitionTool } from '../src/validate';
import { linear } from './fixtures';

const broken = {
  ...linear,
  steps: [
    linear.steps[0],
    {
      ...linear.steps[1],
      fields: [...linear.steps[1].fields, { key: 'email', type: 'text', label: 'Backup', show: [{ field: 'nam', notEmpty: true }] }],
    },
  ],
};

describe('fixes in validate_definition', () => {
  it('attaches fixes to the issues it can repair', () => {
    const { issues } = validateDefinitionTool({ definition: broken });
    expect(issues.find(({ code }) => code === 'duplicate-key')?.fixes).toEqual([
      { title: 'Rename the key to "email_2"', safe: true, patch: [{ op: 'add', path: '/steps/1/fields/1/key', value: 'email_2' }] },
    ]);
    expect(issues.find(({ code }) => code === 'unknown-field')?.fixes?.[0]).toMatchObject({ title: 'Use the field "name"', safe: true });
  });

  it('leaves issues without a known repair as they are', () => {
    const { issues } = validateDefinitionTool({
      definition: { ...linear, steps: [{ ...linear.steps[0], fields: [{ ...linear.steps[0].fields[0], validation: { pattern: '(' } }] }] },
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]).not.toHaveProperty('fixes');
  });
});

describe('fix_definition', () => {
  it('applies the safe fixes, including an unambiguous typo', () => {
    const result = fixDefinitionTool({ definition: JSON.stringify(broken) });
    expect(result.applied.map(({ title }) => title)).toEqual(['Rename the key to "email_2"', 'Use the field "name"']);
    expect((result.definition as typeof broken).steps[1].fields[1]).toMatchObject({ key: 'email_2', show: [{ field: 'name' }] });
    expect(result).toMatchObject({ valid: true, issues: [] });
  });

  it('leaves an ambiguous reference with its unsafe fix', () => {
    const fields = [
      { key: 'email', type: 'email', label: 'Email' },
      { key: 'emails', type: 'text', label: 'Emails' },
      { key: 'note', type: 'text', label: 'Note', show: [{ field: 'emial', notEmpty: true }] },
    ];
    const result = fixDefinitionTool({ definition: { id: 'f', title: 'F', submit: { label: 'Go' }, fields } });
    expect(result.applied).toEqual([]);
    expect(result.valid).toBe(false);
    expect(result.issues).toMatchObject([{ code: 'unknown-field', fixes: [{ safe: false }] }]);
  });

  it('returns a valid report when every issue was safe to fix', () => {
    const { submit: _, ...definition } = linear;
    const result = fixDefinitionTool({ definition });
    expect(result).toMatchObject({
      valid: true,
      issues: [],
      applied: [{ code: 'missing-property', path: '', title: 'Add a submit button labeled "Submit"' }],
    });
    expect(result.definition).toMatchObject({ submit: { label: 'Submit' } });
  });

  it('repairs a misspelled id and an empty label', () => {
    const result = fixDefinitionTool({
      definition: { imd: 'contact', title: 'Contact', submit: { label: 'Send' }, fields: [{ key: 'name', type: 'text', label: '' }] },
    });
    expect(result).toMatchObject({ valid: true, issues: [], definition: { id: 'contact', fields: [{ label: 'Name' }] } });
    expect(result.definition).not.toHaveProperty('imd');
    expect(result.applied.map(({ title }) => title)).toEqual(['Rename "imd" to "id"', 'Set the label to "Name"']);
  });

  it('reports malformed JSON without a definition', () => {
    const result = fixDefinitionTool({ definition: '{ "id": ' });
    expect(result.definition).toBeUndefined();
    expect(result.applied).toEqual([]);
    expect(result.issues[0]).toMatchObject({ code: 'invalid-json' });
  });
});
