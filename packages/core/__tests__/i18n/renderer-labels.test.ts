import { describe, expect, it } from 'vitest';
import { localize, textSlots, translationIssues } from '../../src/i18n';
import { labelFor } from '../../src/internal';
import type { FormDefinition } from '../../src/types';

describe('renderer labels', () => {
  const labelSlots = (definition: FormDefinition) =>
    Object.fromEntries(
      textSlots(definition)
        .filter(({ address }) => address.startsWith('labels.'))
        .map(({ address, text, params }) => [address.slice(7), [text, params]]),
    );

  it('lists clear, chooseFile, required, skip, submit, stepTitle and stepErrors where a renderer uses them', () => {
    const definition = {
      id: 'f',
      title: 'F',
      submit: {},
      steps: [
        {
          id: 'one',
          title: '',
          skip: {},
          fields: [
            { key: 'day', type: 'date', label: 'Day', validation: { required: true } },
            { key: 'scan', type: 'file', label: 'Scan' },
          ],
        },
        { id: 'two', title: 'Two', fields: [{ key: 'note', type: 'text', label: 'Note' }] },
      ],
    } as unknown as FormDefinition;
    expect(labelSlots(definition)).toMatchObject({
      clear: ['Clear', []],
      chooseFile: ['Choose file', []],
      required: ['required', []],
      skip: ['Skip', []],
      submit: ['Submit', []],
      stepTitle: ['Step {index}', ['index']],
      stepErrors: ['Errors: {count}', ['count']],
    });
    const plain = labelSlots({
      id: 'f',
      title: 'F',
      submit: { label: 'Send' },
      steps: [
        { id: 'one', title: 'One', skip: { label: 'Later' }, fields: [{ key: 'note', type: 'text', label: 'Note' }] },
        { id: 'two', title: 'Two', fields: [] },
      ],
    });
    expect(Object.keys(plain)).toEqual(['continue', 'back', 'stepOf', 'errorSummary', 'stepErrors']);
  });

  it('asks for required inside groups and stepTitle only for untitled steps', () => {
    const definition: FormDefinition = {
      id: 'f',
      title: 'F',
      submit: { label: 'Send' },
      fields: [
        {
          key: 'people',
          type: 'group',
          label: 'People',
          fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
        },
      ],
    };
    expect(labelSlots(definition)).toHaveProperty('required');
    expect(labelSlots(definition)).not.toHaveProperty('stepTitle');
    expect(labelSlots(definition)).not.toHaveProperty('stepErrors');
  });

  it('formats the step title and the error mark with their params', () => {
    expect(labelFor('stepTitle', { index: 3 })).toBe('Step 3');
    expect(labelFor('stepErrors', { count: 2 })).toBe('Errors: 2');
    expect(labelFor('stepErrors', { count: 2 }, { stepErrors: 'Ошибки: {count}' })).toBe('Ошибки: 2');
  });

  it('translates the new labels through an overlay', () => {
    const definition = {
      id: 'f',
      title: 'F',
      submit: {},
      fields: [{ key: 'scan', type: 'file', label: 'Scan' }],
    } as unknown as FormDefinition;
    const overlay = {
      title: 'Ф',
      labels: { submit: 'Отправить', clear: 'Очистить', chooseFile: 'Выбрать файл' },
      fields: { scan: { label: 'Скан' } },
    };
    const issues = translationIssues(definition, overlay);
    expect(issues.unknown).toEqual([]);
    expect(issues.missing.filter((address) => address.startsWith('labels.'))).toEqual(['labels.errorSummary']);
    expect(localize(definition, { overlay }).definition.labels).toMatchObject({
      submit: 'Отправить',
      clear: 'Очистить',
      chooseFile: 'Выбрать файл',
    });
  });
});
