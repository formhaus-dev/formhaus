import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import { createPathPatch } from '../../src/engine/path-patch';
import { createVisibility } from '../../src/engine/visibility-state';
import { indexDefinition } from '../../src/engine/visibility-index';
import type { FormDefinition } from '../../src/types';

type Values = Record<string, unknown>;

const text = (key: string, extra: object = {}) => ({ key, type: 'text' as const, label: key, ...extra });

const routed: FormDefinition = {
  id: 'routed',
  title: '',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'start',
      title: '',
      fields: [text('kind'), text('gate'), text('note')],
      routes: [{ to: 'biz', show: [{ field: 'kind', eq: 'biz' }] }, { to: 'me' }],
    },
    { id: 'biz', title: '', fields: [text('company', { defaultValue: 'Corp' })], routes: [{ to: null }] },
    { id: 'me', title: '', show: [{ field: 'gate', eq: 'open' }], fields: [text('nick', { defaultValue: 'nn' })] },
  ],
};

const flat: FormDefinition = {
  id: 'flat',
  title: '',
  submit: { label: 'Send' },
  fields: [text('a'), text('b', { show: [{ field: 'a', eq: 'y' }] }), text('c')],
};

function written(definition: FormDefinition, start: Values, key: string, value: unknown) {
  const visibility = createVisibility(definition);
  const values = { ...start };
  visibility.reconcileHidden(values, {}, true);
  values[key] = value;
  visibility.reconcileHidden(values, {}, false, key);
  const reference = createVisibility(definition);
  const expected = { ...start };
  reference.reconcileHidden(expected, {}, true);
  expected[key] = value;
  reference.reconcileHidden(expected, {}, false);
  return { values, expected, active: visibility.conditionValues(values), reference: reference.conditionValues(expected) };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('incremental path patch', () => {
  const patch = createPathPatch(indexDefinition(routed));
  const steps = routed.steps!;

  it('leaves route keys to a full pass', () => {
    expect(patch('kind', { kind: 'biz' }, {}, steps)).toBeUndefined();
    const { values, expected, active, reference } = written(routed, { kind: 'me', gate: 'open' }, 'kind', 'biz');
    expect(values).toEqual(expected);
    expect(active).toEqual(reference);
  });

  it('leaves step condition keys to a full pass', () => {
    expect(patch('gate', { gate: 'open' }, {}, steps)).toBeUndefined();
    const { values, expected, active, reference } = written(routed, { kind: 'me', gate: 'open', nick: 'x' }, 'gate', 'shut');
    expect(values).toEqual(expected);
    expect(active).toEqual(reference);
  });

  it('patches a plain key', () => {
    expect(patch('note', { note: ' hi ' }, {}, steps)).toEqual([['note', true, 'hi']]);
  });

  it('does not remember keys outside the definition', () => {
    const set = vi.spyOn(Map.prototype, 'set');
    const fresh = createPathPatch(indexDefinition(routed));
    expect(fresh('ghost', { ghost: 1 }, {}, steps)).toBeUndefined();
    expect(set.mock.calls.some(([key]) => key === 'ghost')).toBe(false);
    fresh('note', { note: 'x' }, {}, steps);
    expect(set.mock.calls.some(([key]) => key === 'note')).toBe(true);
  });

  it('keeps definition order when a patched key comes back', () => {
    const engine = new FormEngine(flat, { a: 'y', b: '1', c: '2' });
    engine.setValue('a', 'n');
    engine.setValue('a', 'y');
    expect(Object.keys(engine.getSubmitValues())).toEqual(['a', 'b', 'c']);
    const { active, reference } = written(flat, { a: 'n', b: '1', c: '2' }, 'a', 'y');
    expect(Object.entries(active)).toEqual(Object.entries(reference));
    expect(Object.keys(active)).toEqual(['a', 'b', 'c']);
  });
});

describe('incremental hidden queue', () => {
  it('runs a full pass after start values are seeded', () => {
    const visibility = createVisibility(flat);
    const values: Values = { a: 'y' };
    visibility.reconcileHidden(values, {}, true);
    visibility.seed({ b: 'seeded' });
    values.c = 'x';
    visibility.reconcileHidden(values, {}, false, 'c');
    expect(values).toEqual({ a: 'y', b: 'seeded', c: 'x' });
  });

  it('runs a full pass after start values are reseeded and restored', () => {
    const visibility = createVisibility(flat);
    const values: Values = { a: 'y' };
    visibility.reconcileHidden(values, {}, true);
    const restore = visibility.reseed(['b'], { b: 'reseeded' });
    values.c = 'x';
    visibility.reconcileHidden(values, {}, false, 'c');
    expect(values.b).toBe('reseeded');
    delete values.b;
    restore(new Set());
    values.c = 'y';
    visibility.reconcileHidden(values, {}, false, 'c');
    expect(values.b).toBeUndefined();
  });
});

describe('cached values and user code', () => {
  const steps: FormDefinition = {
    id: 'steps',
    title: '',
    submit: { label: 'Send' },
    steps: [
      { id: 'one', title: '', fields: [text('a', { validation: { validator: 'tag' } }), text('b')] },
      { id: 'two', title: '', fields: [text('c', { validation: { required: true } })] },
    ],
  };

  it('drops what a step validator wrote into its values after the next write', () => {
    const engine = new FormEngine(
      steps,
      {},
      {
        validators: {
          tag: (_value, all) => {
            all.derived = 'computed';
            return null;
          },
        },
      },
    );
    engine.setValue('a', '1');
    engine.setValue('b', 'w');
    expect(engine.canGoNext).toBe(true);
    expect(engine.getSubmitValues()).toEqual({ a: '1', b: 'w', derived: 'computed' });
    engine.setValue('b', 'x');
    expect(engine.getSubmitValues()).toEqual({ a: '1', b: 'x' });
    engine.setValue('b', 'y');
    expect(engine.getSubmitValues()).toEqual({ a: '1', b: 'y' });
  });

  it('rechecks every field on the next write after a step validator changed its values', () => {
    const shown: FormDefinition = {
      id: 'shown',
      title: '',
      submit: { label: 'Send' },
      steps: [
        {
          id: 'one',
          title: '',
          fields: [text('a', { validation: { validator: 'flip' } }), text('extra', { show: [{ field: 'a', neq: 'n' }] }), text('b')],
        },
        { id: 'two', title: '', fields: [text('c')] },
      ],
    };
    const engine = new FormEngine(
      shown,
      { a: 'n' },
      {
        validators: {
          flip: (_value, all) => {
            all.a = 'flipped';
            return null;
          },
        },
      },
    );
    expect(engine.canGoNext).toBe(true);
    engine.setErrors({ extra: 'bad' });
    engine.setValue('b', 'x');
    expect(engine.errors).toEqual({});
  });

  it('validates later steps against values a validator wrote through the engine', () => {
    const engine: FormEngine = new FormEngine(
      steps,
      { a: '1' },
      {
        validators: {
          tag: () => {
            engine.setValue('c', 'filled');
            return null;
          },
        },
      },
    );
    const versions: number[] = [];
    engine.subscribeField('c', () => versions.push(engine.getFieldSnapshot('c')));
    expect(engine.validate()).toEqual({});
    expect(engine.errors).toEqual({});
    expect(versions).toEqual([1]);
  });

  it('returns group items that are not shared with later reads', () => {
    const grouped: FormDefinition = {
      id: 'grouped',
      title: '',
      formatVersion: '1.1',
      submit: { label: 'Send' },
      fields: [text('name'), { key: 'people', type: 'group', label: 'People', fields: [text('person')] }],
    };
    const engine = new FormEngine(grouped, { people: [{ person: 'Ada' }] });
    const first = engine.getSubmitValues() as { people: Values[] };
    first.people[0].person = 'changed';
    engine.setValue('name', 'x');
    expect(engine.getSubmitValues()).toEqual({ name: 'x', people: [{ person: 'Ada' }] });
  });
});
