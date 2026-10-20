import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src/engine';
import { checkDefinition } from '../../src/definition-validation';
import { validateSubmission } from '../../src/server';
import type { FormDefinition, FormStep } from '../../src/types';

const SIZE = 300;

function counted(definition: FormDefinition): { definition: FormDefinition; reads: () => number } {
  let reads = 0;
  const read = <T>(value: T) => {
    reads++;
    return value;
  };
  for (const step of definition.steps ?? []) {
    const { show, routes } = step;
    Object.defineProperty(step, 'show', { enumerable: show !== undefined, get: () => read(show) });
    Object.defineProperty(step, 'routes', { enumerable: routes !== undefined, get: () => read(routes) });
  }
  return { definition, reads: () => reads };
}

const text = (index: number, extra: object = {}) => ({ key: `f${index}`, type: 'text' as const, label: 'F', ...extra });
const chained = (index: number) => (index ? { show: [{ field: `f${index - 1}`, eq: 'x' }] } : {});
const steps = (make: (index: number) => FormStep): FormDefinition => ({
  id: 'chain',
  title: 'Chain',
  submit: { label: 'Send' },
  steps: Array.from({ length: SIZE }, (_, index) => make(index)),
});
const values = Object.fromEntries(Array.from({ length: SIZE }, (_, index) => [`f${index}`, 'x']).slice(1));

const fieldChain = () => counted(steps((index) => ({ id: `s${index}`, title: 'S', fields: [text(index, chained(index))] })));
const stepChain = () => counted(steps((index) => ({ id: `s${index}`, title: 'S', ...chained(index), fields: [text(index)] })));

describe('work on long chains', () => {
  it.each([
    ['a field chain across steps', fieldChain],
    ['a step chain', stepChain],
  ])('reads each step a bounded number of times for %s', (_, make) => {
    const engine = make();
    new FormEngine(engine.definition, values);
    expect(engine.reads()).toBeLessThan(SIZE * 40);
    const server = make();
    const result = validateSubmission(server.definition, values);
    expect(result.values).toEqual({});
    expect(server.reads()).toBeLessThan(SIZE * 40);
  });

  it('checks a definition with many steps without walking every pair', () => {
    const { definition, reads } = fieldChain();
    expect(checkDefinition(definition).filter((issue) => issue.severity === 'error')).toEqual([]);
    expect(reads()).toBeLessThan(SIZE * 40);
  });
});

describe('pattern test limit', () => {
  const codes = (length: number): FormDefinition => ({
    id: 'codes',
    title: 'Codes',
    submit: { label: 'Send' },
    fields: [
      {
        key: 'codes',
        type: 'group',
        label: 'Codes',
        validation: { maxLength: length },
        fields: [{ key: 'code', type: 'text', label: 'Code', validation: { pattern: '^x$' } }],
      },
    ],
  });
  const payload = (length: number) => ({ codes: Array.from({ length }, () => ({ code: 'x' })) });

  it('runs 10,000 pattern tests in one submission', () => {
    expect(validateSubmission(codes(10_000), payload(10_000)).errors).toEqual({});
  });

  it('fails every pattern check after 10,000 tests in one submission', () => {
    expect(validateSubmission(codes(10_002), payload(10_002)).errors).toEqual({
      'codes.10000.code': 'Invalid format',
      'codes.10001.code': 'Invalid format',
    });
  });
});
