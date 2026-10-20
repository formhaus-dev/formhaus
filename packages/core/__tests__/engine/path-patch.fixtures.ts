import fc from 'fast-check';
import type { FormDefinition, FormNode, FormStep, ShowCondition } from '../../src';

const keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const GATE = 'z';

type Rule = { pick: number; back: boolean; test: 'eq' | 'neq' | 'notEmpty'; value: string };
type Leaf = { type: string; show?: Rule[]; showAny?: Rule[]; item?: Rule[] };
type Shape = { section?: Rule[]; fields: Leaf[] };

const weighted = <T>(...choices: [number, T][]) =>
  fc.oneof(...choices.map(([weight, value]) => ({ weight, arbitrary: fc.constant(value) })));
const rule: fc.Arbitrary<Rule> = fc.record({
  pick: fc.nat({ max: keys.length - 1 }),
  back: weighted([4, true], [1, false]),
  test: weighted<Rule['test']>([2, 'eq'], [1, 'neq'], [1, 'notEmpty']),
  value: weighted([2, 'x'], [1, 'y']),
});
const some = (count: number, nil: number) =>
  fc.oneof(
    { weight: nil, arbitrary: fc.constant(undefined) },
    { weight: 1, arbitrary: fc.array(rule, { minLength: 1, maxLength: count }) },
  );
const leaf: fc.Arbitrary<Leaf> = fc.record({
  type: weighted([5, 'text'], [2, 'radio'], [1, 'group']),
  show: some(2, 1),
  showAny: some(2, 3),
  item: some(1, 3),
});
const shape: fc.Arbitrary<Shape> = fc.oneof(
  { weight: 4, arbitrary: leaf.map((field) => ({ fields: [field] })) },
  { weight: 1, arbitrary: fc.record({ section: some(2, 1), fields: fc.array(leaf, { minLength: 2, maxLength: 3 }) }) },
);
const stepShape = fc.record({
  shapes: fc.array(shape, { minLength: 1, maxLength: 3 }),
  show: some(1, 2),
  routes: fc.option(fc.array(fc.record({ to: fc.option(fc.nat({ max: 7 }), { nil: null }), show: some(1, 2) }), { maxLength: 2 }), {
    nil: undefined,
  }),
});
const shown = (show?: ShowCondition[], showAny?: ShowCondition[]) => ({ ...(show ? { show } : {}), ...(showAny ? { showAny } : {}) });
const radio = [
  { value: 'x', label: 'x' },
  { value: 'y', label: 'y' },
];

function build(
  valid: boolean,
  flat: boolean,
  steps: { shapes: Shape[]; show?: Rule[]; routes?: { to: number | null; show?: Rule[] }[] }[],
  order: string[],
): FormDefinition {
  let next = 0;
  let sections = 0;
  const condition = (field: string, { test, value }: Rule): ShowCondition =>
    test === 'notEmpty' ? { field, notEmpty: true } : { field, [test]: value };
  const resolve = (list: Rule[] | undefined, at: number): ShowCondition[] | undefined => {
    const resolved = list?.flatMap((item) => {
      if (item.back && at > 0) return [condition(order[at - 1 - (item.pick % at)], item)];
      return valid ? [] : [condition(order[item.pick], item)];
    });
    return resolved?.length ? resolved : undefined;
  };
  const field = ({ type, show, showAny, item }: Leaf): FormNode => {
    const at = next++;
    const key = order[at];
    const own = shown(resolve(show, at), resolve(showAny, at));
    if (type === 'group')
      return { key, type, label: key, ...own, fields: [{ key: `${key}i`, type: 'text', label: 'i', ...shown(resolve(item, at)) }] };
    return { key, type: type as 'text', label: key, ...own, ...(type === 'radio' ? { options: radio } : {}) };
  };
  const nodes = (list: Shape[]): FormNode[] =>
    list.flatMap(({ section, fields }) => {
      const first = next;
      const built = fields.slice(0, order.length - next).map(field);
      if (built.length < 2) return built;
      return [{ key: `sec${sections++}`, type: 'section', title: 'S', ...shown(resolve(section, first)), fields: built } as FormNode];
    });
  const built = steps.map((step) => nodes(step.shapes));
  for (let index = 0; next < order.length; index++) built[index % built.length].push(field({ type: 'text' }));
  const base = { id: 'fuzz', title: 'Fuzz', submit: { label: 'Send' } };
  if (flat) return { ...base, fields: built.flat() };
  const gated = (list?: Rule[]) => list?.map((item) => condition(GATE, item));
  const target = (from: number, to: number | null) =>
    to === null ? null : valid ? (to > from && to < steps.length ? `s${to}` : undefined) : `s${to}`;
  const gate: FormStep = { id: 'gate', title: 'Gate', fields: [{ key: GATE, type: 'text', label: GATE }] };
  return {
    ...base,
    steps: [
      gate,
      ...steps.map((step, index) => {
        const routes = (step.routes ?? []).flatMap((route) => {
          const to = target(index, route.to);
          return to === undefined ? [] : [{ to, ...shown(gated(route.show)) }];
        });
        return {
          id: `s${index}`,
          title: `S${index}`,
          fields: built[index],
          ...shown(gated(step.show)),
          ...(step.routes ? { routes } : {}),
        };
      }),
    ],
  };
}

export const pathDefinitions = (valid: boolean): fc.Arbitrary<FormDefinition> =>
  fc
    .record({ flat: fc.boolean(), steps: fc.array(stepShape, { minLength: 1, maxLength: 7 }) })
    .chain(({ flat, steps }) =>
      fc.shuffledSubarray(keys, { minLength: keys.length, maxLength: keys.length }).map((order) => build(valid, flat, steps, order)),
    );

const answer = fc.constantFrom<unknown>('x', 'x', 'y', ' x ', '', undefined, [{}]);
export const valuesArbitrary = fc.record(
  Object.fromEntries([...keys, GATE].map((key) => [key, answer])) as Record<string, fc.Arbitrary<unknown>>,
);
export const writeArbitrary = fc.tuple(fc.constantFrom(...keys, GATE), answer);
