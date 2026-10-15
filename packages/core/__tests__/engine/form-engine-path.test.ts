import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createActivePath } from '../../src/engine/step-routes';
import { isVisible } from '../../src/visibility';
import { trimValue } from '../../src/validation/type-checks';
import type { FormDefinition, FormField, FormStep, ShowCondition } from '../../src';

type Values = Record<string, unknown>;

const numRuns = Number(process.env.FORMHAUS_FUZZ_RUNS ?? 3000);

function stepValues(step: { fields: FormField[] }, values: Values, previous: Values): Values {
  const candidates = { ...previous };
  for (const field of step.fields) candidates[field.key] = trimValue(field, values[field.key]);
  const result: Values = {};
  for (const field of step.fields) {
    if (isVisible(field, candidates) && values[field.key] !== undefined) result[field.key] = trimValue(field, values[field.key]);
  }
  return result;
}

function referencePath(definition: FormDefinition, values: Values): { steps: string[]; values: [string, unknown][] } {
  const steps = definition.steps ?? [];
  const indexes = new Map(steps.map((step, index) => [step.id, index]));
  const path: FormStep[] = [];
  const available: Values = {};
  for (let index = 0; index < steps.length;) {
    const step = steps[index];
    if (!isVisible(step, available)) { index++; continue; }
    path.push(step);
    Object.assign(available, stepValues(step, values, available));
    const route = step.routes?.find((route) => (
      isVisible(route, available) && (route.to === null || ((indexes.get(route.to) ?? -1) > index
        && isVisible(steps[indexes.get(route.to)!], available)))
    ));
    if (route?.to === null) break;
    index = route ? indexes.get(route.to)! : index + 1;
  }
  const active: Values = {};
  const groups = steps.length ? path : [{ fields: definition.fields ?? [] }];
  for (const step of groups) Object.assign(active, stepValues(step, values, active));
  return { steps: path.map((step) => step.id), values: Object.entries(active) };
}

const keys = ['a', 'b', 'c', 'd'];
const conditionArbitrary: fc.Arbitrary<ShowCondition> = fc.oneof(
  fc.record({ field: fc.constantFrom(...keys), eq: fc.constantFrom('x', 'y') }),
  fc.record({ field: fc.constantFrom(...keys), notEmpty: fc.constant(true) }),
  fc.record({ field: fc.constantFrom(...keys), in: fc.constant(['x', 'y']) }),
);
const conditionsArbitrary = fc.option(fc.array(conditionArbitrary, { minLength: 1, maxLength: 2 }), { nil: undefined });
const fieldArbitrary: fc.Arbitrary<FormField> = fc.record({
  key: fc.constantFrom(...keys),
  type: fc.constantFrom('text', 'radio'),
  show: conditionsArbitrary,
  showAny: conditionsArbitrary,
}).map(({ key, type, show, showAny }) => ({
  key, type, label: key,
  ...(type === 'radio' ? { options: [{ value: 'x', label: 'x' }, { value: 'y', label: 'y' }] } : {}),
  ...(show ? { show } : {}),
  ...(showAny ? { showAny } : {}),
}));
const definitionArbitrary: fc.Arbitrary<FormDefinition> = fc.array(fc.record({
  fields: fc.array(fieldArbitrary, { minLength: 1, maxLength: 4 }),
  show: conditionsArbitrary,
  routes: fc.option(fc.array(fc.record({ to: fc.option(fc.integer({ min: 0, max: 5 }), { nil: null }), show: conditionsArbitrary }), { maxLength: 2 }), { nil: undefined }),
}), { minLength: 0, maxLength: 6 }).chain((steps) => fc.boolean().map((flat) => ({
  id: 'path',
  title: 'Path',
  submit: { label: 'Send' },
  ...(flat || steps.length === 0
    ? { fields: steps.flatMap((step) => step.fields) }
    : {
      steps: steps.map((step, index) => ({
        id: `s${index}`,
        title: `Step ${index}`,
        fields: step.fields,
        ...(step.show ? { show: step.show } : {}),
        ...(step.routes ? { routes: step.routes.map((route) => ({ to: route.to === null ? null : `s${route.to}`, ...(route.show ? { show: route.show } : {}) })) } : {}),
      })),
    }),
})));
const valuesArbitrary = fc.dictionary(fc.constantFrom(...keys), fc.constantFrom<unknown>('x', 'y', ' x ', '', undefined));

describe('active path', () => {
  it('matches the step-by-step projection for any definition and answers', () => {
    fc.assert(fc.property(definitionArbitrary, valuesArbitrary, (definition, values) => {
      const path = createActivePath(definition);
      const expected = referencePath(definition, values);
      expect(path.steps(values).map((step) => step.id)).toEqual(expected.steps);
      expect(Object.entries(path.values(values))).toEqual(expected.values);
    }), { numRuns });
  });

  it('keeps an earlier answer when a later field with the same key is hidden', () => {
    const definition: FormDefinition = {
      id: 'dup', title: 'Dup', submit: { label: 'Send' },
      steps: [
        { id: 'one', title: 'One', fields: [{ key: 'a', type: 'text', label: 'A' }] },
        { id: 'two', title: 'Two', fields: [{ key: 'a', type: 'text', label: 'A again', show: [{ field: 'a', eq: 'never' }] }, { key: 'b', type: 'text', label: 'B' }] },
      ],
    };
    const path = createActivePath(definition);
    expect(Object.entries(path.values({ a: ' kept ', b: 'b' }))).toEqual([['a', 'kept'], ['b', 'b']]);
  });
});
