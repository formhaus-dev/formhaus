import { expect, it } from 'vitest';
import { parseAndValidate, getSteps } from '../parse';
import definition from '../../../../examples/definitions/branching-form.json';

it('preserves routing and auto-advance configuration through the actual Figma parser', () => {
  const parsed = parseAndValidate(JSON.stringify(definition));
  expect(JSON.parse(JSON.stringify(parsed))).toEqual(definition);
  expect(getSteps(parsed)[0]).toMatchObject({ next: false, routes: definition.steps[0].routes,
    fields: [expect.objectContaining({ autoAdvance: true })] });
});
