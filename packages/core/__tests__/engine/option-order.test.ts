import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormEngine, type FieldOption, type FormDefinition } from '../../src';
import { shownOptions } from '../../src/internal';

const options: FieldOption[] = ['figma', 'sketch', 'framer', 'penpot'].map((value) => ({ value, label: value }));

const definition: FormDefinition = {
  formatVersion: '1.6',
  id: 'f',
  title: 'F',
  submit: { label: 'Send' },
  fields: [
    { key: 'tools', type: 'radio', label: 'Tools', randomize: true, options },
    { key: 'fixed', type: 'radio', label: 'Fixed', options },
  ],
};

const choices: FieldOption[] = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];

const values = (list: FieldOption[] | undefined) => list?.map(({ value }) => value);

describe('option order', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates a different 32 digit hex seed for each engine', () => {
    const first = new FormEngine(definition);
    expect(first.seed).toMatch(/^[0-9a-f]{32}$/);
    expect(new FormEngine(definition).seed).not.toBe(first.seed);
  });

  it('falls back to Math.random without crypto', () => {
    vi.stubGlobal('crypto', undefined);
    expect(new FormEngine(definition).seed).toMatch(/^[0-9a-f]{32}$/);
  });

  it('keeps the given seed and returns the source list of a field without randomize', () => {
    const engine = new FormEngine(definition, {}, { seed: 'visitor-1' });
    expect(engine.seed).toBe('visitor-1');
    expect(engine.orderOptions('fixed')).toBe(options);
    expect(values(engine.orderOptions('tools'))).toEqual(['penpot', 'framer', 'sketch', 'figma']);
  });

  it('orders the item field of the group on the active branch', () => {
    const team = (randomize: boolean) => ({
      key: 'team',
      type: 'group' as const,
      label: 'Team',
      fields: [{ key: 'role', type: 'radio', label: 'Role', randomize, options }],
    });
    const branched: FormDefinition = {
      formatVersion: '1.6',
      id: 'f',
      title: 'F',
      submit: { label: 'Send' },
      steps: [
        {
          id: 'start',
          title: 'Start',
          fields: [{ key: 'kind', type: 'radio', label: 'Kind', options: choices }],
          routes: [{ to: 'b', show: [{ field: 'kind', eq: 'b' }] }],
        },
        { id: 'a', title: 'A', fields: [team(false)], routes: [{ to: null }] },
        { id: 'b', title: 'B', fields: [team(true)] },
      ],
    };
    const engine = new FormEngine(branched, { kind: 'b' }, { seed: 'visitor-1', onWarning: () => {} });
    expect(values(engine.orderOptions('team.role'))).toEqual(['framer', 'penpot', 'sketch', 'figma']);
  });

  it('shows the written order before mount unless the host passed a seed', () => {
    const generated = new FormEngine(definition);
    const seeded = new FormEngine(definition, {}, { seed: 'visitor-1' });
    const [field] = definition.fields!;
    expect(shownOptions(generated, 'tools', field, options, false)).toBe(options);
    expect(values(shownOptions(seeded, 'tools', field, options, false))).toEqual(['penpot', 'framer', 'sketch', 'figma']);
    expect(shownOptions(seeded, 'fixed', definition.fields![1], undefined, true)).toBeUndefined();
  });
});
