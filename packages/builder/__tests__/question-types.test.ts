import { describe, expect, it } from 'vitest';
import {
  addField,
  addOption,
  addStatement,
  canAutoAdvance,
  canBranch,
  childrenOf,
  createForm,
  findIssues,
  fromCondition,
  fromDefinition,
  isPage,
  matrixColumns,
  operatorsFor,
  OPERATOR_LABELS,
  QUESTION_TYPES,
  removeOption,
  setFieldProp,
  setFieldType,
  setLogic,
  setMatrix,
  setMatrixColumns,
  setOptionImage,
  setOptionLabel,
  toCondition,
  toDefinition,
} from '../src';

describe('scale and rating', () => {
  it('are question types that branch and auto-advance', () => {
    expect(QUESTION_TYPES.map((item) => item.type)).toEqual(expect.arrayContaining(['scale', 'rating']));
    expect(canBranch('scale') && canBranch('rating')).toBe(true);
    expect(canAutoAdvance('rating') && !canAutoAdvance('multiselect')).toBe(true);
  });

  it('keeps anchors and range through a round trip', () => {
    const definition = {
      id: 'nps',
      title: 'NPS',
      formatVersion: '1.3',
      submit: { label: 'Send' },
      fields: [
        {
          key: 'score',
          type: 'scale',
          label: 'How likely?',
          autoAdvance: true,
          validation: { required: true, min: 0, max: 10 },
          options: [
            { value: '0', label: 'Not at all likely' },
            { value: '10', label: 'Extremely likely' },
          ],
        },
      ],
    };
    expect(toDefinition(fromDefinition(definition))).toEqual(definition);
  });

  it('drops anchors and range when the type leaves scale', () => {
    const form = createForm();
    const score = addField(form, { step: null }, { type: 'scale', label: 'Score' });
    score.extra = { autoAdvance: true, validation: { min: 0, max: 10, required: 'Pick one' }, options: [{ value: '0', label: 'Low' }] };
    setFieldType(form, score.uid, 'rating');
    expect(score.extra).toEqual({
      autoAdvance: true,
      validation: { max: 10, required: 'Pick one' },
      options: [{ value: '0', label: 'Low' }],
    });
    setFieldType(form, score.uid, 'text');
    expect(score.extra).toEqual({ validation: { required: 'Pick one' } });
  });
});

describe('numeric conditions', () => {
  it('offers at least and at most for numbers', () => {
    expect(operatorsFor('scale')).toEqual(['eq', 'neq', 'gte', 'lte', 'in', 'notIn', 'notEmpty']);
    expect(operatorsFor('number')).toEqual(['eq', 'neq', 'gte', 'lte', 'notEmpty']);
    expect([OPERATOR_LABELS.gte, OPERATOR_LABELS.lte]).toEqual(['is at least', 'is at most']);
  });

  it('stores scale values as numbers', () => {
    expect(toCondition({ field: 'score', operator: 'lte', value: '6' }, 'scale')).toEqual({ field: 'score', lte: 6 });
    expect(toCondition({ field: 'score', operator: 'in', value: ['9', '10'] }, 'rating')).toEqual({ field: 'score', in: [9, 10] });
    expect(toCondition({ field: 'plan', operator: 'in', value: ['1'] }, 'radio')).toEqual({ field: 'plan', in: ['1'] });
  });

  it('reads gte and lte back only on numeric fields', () => {
    expect(fromCondition({ field: 'score', gte: 9 }, 'scale')).toEqual({ field: 'score', operator: 'gte', value: '9' });
    expect(fromCondition({ field: 'score', lte: 6 }, 'number')).toEqual({ field: 'score', operator: 'lte', value: '6' });
    expect(fromCondition({ field: 'name', gte: 2 }, 'text')).toBeUndefined();
    expect(fromCondition({ field: 'score', gt: 6 }, 'scale')).toBeUndefined();
  });

  it('writes a between range as two conditions', () => {
    const form = createForm();
    const score = addField(form, { step: null }, { type: 'scale', label: 'Score' });
    const why = addField(form, { step: null }, { type: 'textarea', label: 'Why' });
    setLogic(form, why.uid, 'all', [
      { field: score.key, operator: 'gte', value: '7' },
      { field: score.key, operator: 'lte', value: '8' },
    ]);
    expect(toDefinition(form).fields?.[1].show).toEqual([
      { field: 'score', gte: 7 },
      { field: 'score', lte: 8 },
    ]);
  });
});

function matrix() {
  const form = createForm();
  const section = addField(form, { step: null }, { type: 'section', label: 'How much do you agree?' });
  const [first] = childrenOf(form, section.uid);
  first.label = 'The tool is fast';
  const second = addField(form, { after: first.uid }, { label: 'The tool is clear' });
  return { form, section, first, second };
}

describe('matrix', () => {
  it('turns rows into radios with default columns', () => {
    const { form, section, second } = matrix();
    setMatrix(form, section.uid, true);
    expect(second.type).toBe('radio');
    expect(matrixColumns(form, section.uid)).toEqual(['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree']);
    const fields = (toDefinition(form).fields?.[0] as { layout?: string; fields: { options: unknown[] }[] }) ?? {};
    expect(fields.layout).toBe('matrix');
    expect(fields.fields[0].options).toEqual(fields.fields[1].options);
  });

  it('syncs columns to every row', () => {
    const { form, section, first, second } = matrix();
    setMatrix(form, section.uid, true);
    setMatrixColumns(form, section.uid, ['No', 'Maybe', 'Yes']);
    expect(second.options.map((option) => [option.label, option.value])).toEqual([
      ['No', 'no'],
      ['Maybe', 'maybe'],
      ['Yes', 'yes'],
    ]);
    setOptionLabel(form, second.uid, second.options[2].uid, 'Sure');
    addOption(form, second.uid, undefined, 'Always');
    removeOption(form, first.uid, first.options[0].uid);
    expect(first.options.map((option) => option.label)).toEqual(['Maybe', 'Sure', 'Always']);
    expect(second.options.map((option) => option.label)).toEqual(['Maybe', 'Sure', 'Always']);
    expect(new Set([...first.options, ...second.options].map((option) => option.uid)).size).toBe(6);
  });

  it('gives a new row the matrix columns', () => {
    const { form, section, second } = matrix();
    setMatrix(form, section.uid, true);
    const third = addField(form, { after: second.uid }, { label: 'The tool is cheap' });
    expect(third.type).toBe('radio');
    expect(third.options.map((option) => option.label)).toEqual(matrixColumns(form, section.uid));
  });

  it('keeps the rows when the layout is switched off', () => {
    const { form, section, second } = matrix();
    setMatrix(form, section.uid, true);
    setMatrix(form, section.uid, false);
    expect(toDefinition(form).fields?.[0]).not.toHaveProperty('layout');
    expect(second.options).toHaveLength(5);
  });
});

describe('statements', () => {
  it('adds a welcome step before every other step', () => {
    const form = createForm();
    addField(form, { step: null }, { label: 'Name' });
    const page = addStatement(form, { page: null }, { title: 'Welcome', description: 'Two minutes.', next: 'Start' });
    expect(isPage(form.blocks[0]) && form.blocks[0].uid === page.uid).toBe(true);
    const [welcome, rest] = toDefinition(form).steps ?? [];
    expect(welcome).toEqual({ id: 'welcome', title: 'Welcome', description: 'Two minutes.', next: { label: 'Start' }, fields: [] });
    expect(rest).toMatchObject({ id: 'step-1', title: 'Step 2' });
    expect(rest.fields).toHaveLength(1);
    expect(findIssues(form)).toEqual([]);
  });

  it('adds an empty section as a statement', () => {
    const form = createForm();
    const name = addField(form, { step: null }, { label: 'Name' });
    addStatement(form, { after: name.uid }, { title: 'Almost done', description: 'One more question.' });
    expect(toDefinition(form).fields?.[1]).toEqual({
      key: 'almostDone',
      type: 'section',
      title: 'Almost done',
      description: 'One more question.',
      fields: [],
    });
    expect(toDefinition(fromDefinition(toDefinition(form)))).toEqual(toDefinition(form));
  });
});

describe('picture options', () => {
  it('sets and clears an option image', () => {
    const form = createForm();
    const pick = addField(form, { step: null }, { type: 'radio', label: 'Pick' });
    setOptionLabel(form, pick.uid, pick.options[0].uid, 'Red');
    setOptionImage(form, pick.uid, pick.options[0].uid, ' https://example.com/red.png ');
    expect(toDefinition(form).fields?.[0].options?.[0]).toEqual({ value: 'red', label: 'Red', image: 'https://example.com/red.png' });
    setOptionImage(form, pick.uid, pick.options[0].uid, '');
    expect(pick.options[0].extra).toBeUndefined();
  });

  it('keeps columns between radio and multiselect and drops it for other types', () => {
    const form = createForm();
    const pick = addField(form, { step: null }, { type: 'radio', label: 'Pick' });
    setFieldProp(form, pick.uid, 'columns', 2);
    setFieldType(form, pick.uid, 'multiselect');
    expect(pick.extra.columns).toBe(2);
    setFieldType(form, pick.uid, 'select');
    expect(pick.extra.columns).toBeUndefined();
  });

  it('drops columns when the last option image goes', () => {
    const form = createForm();
    const pick = addField(form, { step: null }, { type: 'radio', label: 'Pick' });
    addOption(form, pick.uid);
    const [red, blue, green] = pick.options;
    setOptionImage(form, pick.uid, red.uid, 'https://example.com/red.png');
    setOptionImage(form, pick.uid, blue.uid, 'https://example.com/blue.png');
    setFieldProp(form, pick.uid, 'columns', 2);
    setOptionImage(form, pick.uid, red.uid, '');
    expect(pick.extra.columns).toBe(2);
    removeOption(form, pick.uid, green.uid);
    expect(pick.extra.columns).toBe(2);
    removeOption(form, pick.uid, blue.uid);
    expect(pick.extra.columns).toBeUndefined();
    setOptionImage(form, pick.uid, red.uid, 'https://example.com/red.png');
    setFieldProp(form, pick.uid, 'columns', 3);
    setOptionImage(form, pick.uid, red.uid, ' ');
    expect(pick.extra.columns).toBeUndefined();
    expect(findIssues(form)).toEqual([]);
  });

  it('drops columns from rows of a matrix section', () => {
    const { form, section, first, second } = matrix();
    setFieldType(form, first.uid, 'radio');
    setFieldProp(form, first.uid, 'columns', 2);
    setMatrix(form, section.uid, true);
    expect(first.extra.columns).toBeUndefined();
    expect(second.extra.columns).toBeUndefined();
    const third = addField(form, { after: second.uid }, { type: 'multiselect', label: 'Cheap', extra: { columns: 4 } });
    expect(third.extra.columns).toBeUndefined();
    setFieldProp(form, third.uid, 'columns', 2);
    setFieldType(form, third.uid, 'radio');
    expect(third.extra.columns).toBeUndefined();
    expect(toDefinition(form).fields?.[0]).not.toHaveProperty('fields.0.columns');
  });
});
