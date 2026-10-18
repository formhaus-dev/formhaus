import { describe, expect, it } from 'vitest';
import { checkDefinition } from '../../src';

describe('FormEngine step skip', () => {
  it('warns about skip on a single-step form and with next: false', () => {
    const step = { title: 'Step', skip: { label: 'Skip' }, fields: [] };
    const paths = (definition: unknown) => checkDefinition(definition).map(({ code, path }) => `${code} ${path}`);
    expect(paths({ id: 'one', title: 'One', submit: { label: 'Submit' }, steps: [{ ...step, id: 'only' }] })).toEqual([
      'skip-unreachable /steps/0/skip',
    ]);
    expect(
      paths({
        id: 'two',
        title: 'Two',
        submit: { label: 'Submit' },
        steps: [
          { ...step, id: 'a', next: false },
          { ...step, id: 'b' },
        ],
      }),
    ).toEqual(['skip-unreachable /steps/0/skip']);
  });
});
