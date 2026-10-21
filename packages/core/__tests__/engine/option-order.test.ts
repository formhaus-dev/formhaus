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

  it('shows the written order before mount unless the host passed a seed', () => {
    const generated = new FormEngine(definition);
    const seeded = new FormEngine(definition, {}, { seed: 'visitor-1' });
    const [field] = definition.fields!;
    expect(shownOptions(generated, 'tools', field, options, false)).toBe(options);
    expect(values(shownOptions(seeded, 'tools', field, options, false))).toEqual(['penpot', 'framer', 'sketch', 'figma']);
    expect(shownOptions(seeded, 'fixed', definition.fields![1], undefined, true)).toBeUndefined();
  });
});
