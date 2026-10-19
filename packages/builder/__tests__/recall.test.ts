import { describe, expect, it } from 'vitest';
import { findIssues, fromDefinition } from '../src';

const form = (formatVersion: string) =>
  fromDefinition({
    formatVersion,
    id: 'f',
    title: 'F',
    submit: { label: 'Send' },
    steps: [
      {
        id: 'one',
        title: 'Hi {{nmae}}',
        fields: [
          { key: 'name', type: 'text', label: 'Name', helperText: 'For {{ name }}' },
          { key: 'city', type: 'text', label: 'City of {{name}}', placeholder: '{{email}}' },
        ],
      },
      {
        id: 'two',
        title: 'Thanks',
        description: 'Check your answers: {{name}}, {{city}}',
        fields: [{ key: 'email', type: 'email', label: 'Email' }],
      },
    ],
  });

const messages = (version: string) => {
  const built = form(version);
  return findIssues(built)
    .filter(({ message }) => message.includes('{{'))
    .map(({ uid, message }) => [built.blocks.findIndex((block) => block.uid === uid), message]);
};

describe('answer recall', () => {
  it('warns about unknown keys, later steps and the same field', () => {
    expect(messages('1.5')).toEqual([
      [0, 'Recalls "{{nmae}}", which is not a field.'],
      [1, 'Recalls "{{name}}", which is not answered yet.'],
      [2, 'Recalls "{{email}}", which is not answered yet.'],
    ]);
  });

  it('checks nothing below format 1.5', () => {
    expect(messages('1.4')).toEqual([]);
  });
});
